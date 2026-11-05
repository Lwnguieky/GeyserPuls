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
