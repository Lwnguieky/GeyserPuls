// GEYSERPULS - Professional Split Engine v2
// Bitcoin / Lightning Network

import { createHash, randomUUID } from 'crypto';

export type Member = {
  id: string;
  lightningAddress: string;
  shareBps: number; // 10000 = 100%
  minPayoutSats: number;
  maxPayoutSats?: number;
  weight?: number;
  role: 'creator' | 'dev' | 'designer' | 'writer' | 'treasury';
  isActive: boolean;
};

export type SplitConfig = {
  campaignId: string;
  feeCapBps: number; // ex: 100 = max 1% fee
  dustThresholdSats: number; // ex: 10
  maxConcurrentPayments: number; // ex: 3
  maxRetries: number; // ex: 5
  retryBaseDelayMs: number; // ex: 1000
};

export type Payout = {
  payoutId: string;
  memberId: string;
  lightningAddress: string;
  grossSats: number;
  feeSats: number;
  netSats: number;
  pendingCarrySats: number;
  status: 'ready' | 'held_dust' | 'held_min' | 'capped';
  createdAt: Date;
};

export type SplitResult = {
  distributionId: string;
  campaignId: string;
  totalReceivedSats: number;
  totalFeeSats: number;
  totalDistributedSats: number;
  totalHeldSats: number;
  payouts: Payout[];
  auditHash: string;
};

export class SplitValidationError extends Error {}

function validateInputs(totalSats: number, members: Member[]) {
  if (!Number.isInteger(totalSats) || totalSats <= 0)
    throw new SplitValidationError('totalSats must be positive integer');
  const active = members.filter(m => m.isActive);
  if (active.length === 0) throw new SplitValidationError('No active members');
  const sumBps = active.reduce((s, m) => s + m.shareBps, 0);
  if (sumBps !== 10000) throw new SplitValidationError(`Shares must sum to 10000, got ${sumBps}`);
  if (active.length > 50) throw new SplitValidationError('Max 50 members');
}
// ---------- CÁLCULO - Largest Remainder Method ----------
// Método justo: o resto vai para quem mais perdeu no arredondamento
// Não dá tudo ao primeiro membro como na versão simples

export function calculateSplits(
  totalReceivedSats: number,
  members: Member[],
  config: SplitConfig,
  pendingLedger: Map<string, number>,
  estimatedFeeSats: number
): SplitResult {

  validateInputs(totalReceivedSats, members);

  const distributionId = randomUUID();
  const active = members.filter(m => m.isActive);

  // Fee Cap - Se a fee for abusiva, aborta tudo
  const maxFee = Math.floor((totalReceivedSats * config.feeCapBps) / 10000);
  if (estimatedFeeSats > maxFee) {
    throw new SplitValidationError(`Fee ${estimatedFeeSats} exceeds cap ${maxFee}`);
  }

  const netTotal = totalReceivedSats - estimatedFeeSats;
  if (netTotal <= 0) throw new SplitValidationError('Net total <= 0 after fees');

  type CalcRow = {
    member: Member;
    exact: number;
    floor: number;
    remainder: number;
    pendingBefore: number;
  };

  const rows: CalcRow[] = active.map(m => {
    const pending = pendingLedger.get(m.id) ?? 0;
    const grossExact = (netTotal * m.shareBps) / 10000 + pending;
    const floor = Math.floor(grossExact);
    return {
      member: m,
      exact: grossExact,
      floor,
      remainder: grossExact - floor,
      pendingBefore: pending,
    };
  });

  // Ordena por quem mais perdeu no arredondamento
  const sorted = [...rows].sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    if ((b.member.weight ?? 0) !== (a.member.weight ?? 0))
      return (b.member.weight ?? 0) - (a.member.weight ?? 0);
    return a.member.id.localeCompare(b.member.id);
  });

  const finalAmounts = new Map<string, number>(
    rows.map(r => [r.member.id, r.floor])
  );

  let distributedFloor = rows.reduce((s, r) => s + r.floor, 0);
  let leftover = netTotal + rows.reduce((s, r) => s + r.pendingBefore, 0) - distributedFloor;

  // Dá 1 sat de cada vez aos que mais perderam
  let idx = 0;
  while (leftover > 0 && sorted.length > 0) {
    const row = sorted[idx % sorted.length];
    const current = finalAmounts.get(row.member.id)!;
    const max = row.member.maxPayoutSats ?? Infinity;
    if (current < max) {
      finalAmounts.set(row.member.id, current + 1);
      leftover -= 1;
    }
    idx++;
    if (idx > 10000) break;
  }

  // Gera payouts com Idempotency + Mínimo + Cap
  const payouts: Payout[] = [];
  let totalDistributed = 0;
  let totalHeld = 0;

  for (const row of rows) {
    let amount = finalAmounts.get(row.member.id)!;
    const feeSats = Math.floor((estimatedFeeSats * row.member.shareBps) / 10000);
    let status: Payout['status'] = 'ready';
    let held = 0;

    if (row.member.maxPayoutSats && amount > row.member.maxPayoutSats) {
      held = amount - row.member.maxPayoutSats;
      amount = row.member.maxPayoutSats;
      status = 'capped';
    }

    if (amount > 0 && amount < row.member.minPayoutSats) {
      held = amount;
      amount = 0;
      status = 'held_min';
    }

    if (amount > 0 && amount < config.dustThresholdSats) {
      held = amount;
      amount = 0;
      status = 'held_dust';
    }

    // Idempotency Key - nunca paga 2x a mesma distribuição
    const payoutId = createHash('sha256')
      .update(`${distributionId}:${row.member.id}:${amount}`)
      .digest('hex')
      .slice(0, 32);

    payouts.push({
      payoutId,
      memberId: row.member.id,
      lightningAddress: row.member.lightningAddress,
      grossSats: amount + held,
      feeSats,
      netSats: amount,
      pendingCarrySats: held,
      status,
      createdAt: new Date(),
    });

    totalDistributed += amount;
    totalHeld += held;
  }

  const auditHash = createHash('sha256')
    .update(JSON.stringify({ distributionId, totalReceivedSats, payouts }))
    .digest('hex');

  return {
    distributionId,
    campaignId: config.campaignId,
    totalReceivedSats,
    totalFeeSats: estimatedFeeSats,
    totalDistributedSats: totalDistributed,
    totalHeldSats: totalHeld,
    payouts,
    auditHash,
  };
}
// ---------- EXECUÇÃO - Retry + Concorrência + Anti-Duplicado ----------

export type PaymentGateway = {
  send: (address: string, sats: number, idempotencyKey: string) => Promise<{ preimage: string }>;
  isAlreadyPaid: (idempotencyKey: string) => Promise<boolean>;
};

export async function executeSplits(
  result: SplitResult,
  gateway: PaymentGateway,
  config: SplitConfig
) {
  const queue = result.payouts.filter(p => p.status === 'ready' && p.netSats > 0);
  const results: Array<{ payoutId: string; success: boolean; attempts: number; error?: string }> = [];

  // Processa em lotes de maxConcurrentPayments (ex: 3 de cada vez)
  // Para não sobrecarregar o node Lightning
  for (let i = 0; i < queue.length; i += config.maxConcurrentPayments) {
    const batch = queue.slice(i, i + config.maxConcurrentPayments);
    const batchResults = await Promise.all(
      batch.map(p => payWithRetry(p, gateway, config))
    );
    results.push(...batchResults);
  }

  return { distributionId: result.distributionId, results };
}

async function payWithRetry(
  payout: Payout,
  gateway: PaymentGateway,
  config: SplitConfig
) {
  // Anti-duplicado: se já foi pago antes (crash + restart), não paga de novo
  if (await gateway.isAlreadyPaid(payout.payoutId)) {
    return { payoutId: payout.payoutId, success: true, attempts: 0 };
  }

  let lastError: any;
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const { preimage } = await gateway.send(
        payout.lightningAddress,
        payout.netSats,
        payout.payoutId
      );
      // Salvar preimage = prova criptográfica de pagamento
      await saveProof(payout.payoutId, preimage);
      return { payoutId: payout.payoutId, success: true, attempts: attempt };
    } catch (err) {
      lastError = err;
      // Backoff exponencial + jitter: 1s, 2s, 4s, 8s + random
      const delay = config.retryBaseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  // Depois de 5 tentativas, manda para DLQ para revisão manual
  await sendToDLQ(payout, lastError);
  return { payoutId: payout.payoutId, success: false, attempts: config.maxRetries, error: String(lastError) };
}

// Stubs - ligar ao teu DB / Redis depois
async function saveProof(payoutId: string, preimage: string) { /* INSERT INTO payments ... */ }
async function sendToDLQ(payout: Payout, error: any) { /* INSERT INTO failed_payouts ... */ }
