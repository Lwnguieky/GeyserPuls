// GEYSERPULS - Tests for Split Engine
// Para correr: npm test

import { calculateSplits, Member, SplitConfig } from '../src/core/splitter';

const config: SplitConfig = {
  campaignId: 'test-campaign-1',
  feeCapBps: 100, // max 1% fee
  dustThresholdSats: 10,
  maxConcurrentPayments: 3,
  maxRetries: 5,
  retryBaseDelayMs: 1000,
};

const members: Member[] = [
  { id: 'dev-1', lightningAddress: 'dev@getalby.com', shareBps: 5000, minPayoutSats: 100, role: 'dev', isActive: true },
  { id: 'design-1', lightningAddress: 'design@getalby.com', shareBps: 3000, minPayoutSats: 100, role: 'designer', isActive: true },
  { id: 'writer-1', lightningAddress: 'writer@getalby.com', shareBps: 2000, minPayoutSats: 100, role: 'writer', isActive: true },
];

function test(name: string, fn: () => void) {
  try { fn(); console.log(`✅ ${name}`); }
  catch (e: any) { console.log(`❌ ${name} - ${e.message}`); }
}

// TESTE 1: Soma tem de bater
test('Total distributed + held = total received - fee', () => {
  const r = calculateSplits(10000, members, config, new Map(), 100);
  const sum = r.totalDistributedSats + r.totalHeldSats + r.totalFeeSats;
  if (sum !== 10000) throw new Error(`Expected 10000, got ${sum}`);
});

// TESTE 2: Split 50/30/20 de 9900 net
test('Split 50/30/20 is correct', () => {
  const r = calculateSplits(10000, members, config, new Map(), 100);
  const dev = r.payouts.find(p => p.memberId === 'dev-1')!;
  if (dev.netSats !== 4950) throw new Error(`Dev expected 4950, got ${dev.netSats}`);
});

// TESTE 3: Rejeita se shares não somam 100%
test('Rejects invalid shares', () => {
  const bad = [...members, { id: 'x', lightningAddress: 'x@getalby.com', shareBps: 100, minPayoutSats: 100, role: 'dev' as const, isActive: true }];
  try {
    calculateSplits(10000, bad, config, new Map(), 100);
    throw new Error('Should have thrown');
  } catch (e: any) {
    if (!e.message.includes('10000')) throw e;
  }
});

// TESTE 4: Fee abusiva aborta
test('Rejects fee above cap', () => {
  try {
    calculateSplits(10000, members, config, new Map(), 500); // 5% > 1% cap
    throw new Error('Should have thrown');
  } catch (e: any) {
    if (!e.message.includes('exceeds cap')) throw e;
  }
});

// TESTE 5: Payout pequeno fica pendente
test('Small payout goes to pending', () => {
  const r = calculateSplits(150, members, config, new Map(), 10);
  const writer = r.payouts.find(p => p.memberId === 'writer-1')!;
  if (writer.status !== 'held_min') throw new Error(`Expected held_min, got ${writer.status}`);
});

console.log('All tests done');
