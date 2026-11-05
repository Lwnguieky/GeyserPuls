// GEYSERPULS - Entry Point
import { calculateSplits, executeSplits, Member, SplitConfig } from './core/splitter';

const config: SplitConfig = {
  campaignId: 'geyserpuls-demo-1',
  feeCapBps: 100,
  dustThresholdSats: 10,
  maxConcurrentPayments: 3,
  maxRetries: 5,
  retryBaseDelayMs: 1000,
};

const members: Member[] = [
  { id: 'creator-1', lightningAddress: 'creator@getalby.com', shareBps: 6000, minPayoutSats: 100, role: 'creator', isActive: true },
  { id: 'dev-1', lightningAddress: 'dev@getalby.com', shareBps: 2500, minPayoutSats: 100, role: 'dev', isActive: true },
  { id: 'design-1', lightningAddress: 'design@getalby.com', shareBps: 1500, minPayoutSats: 100, role: 'designer', isActive: true },
];

export function runDemoSplit(totalSats: number) {
  const result = calculateSplits(totalSats, members, config, new Map(), 100);
  console.log(`Distribution: ${result.distributionId}`);
  console.log(`Distributed: ${result.totalDistributedSats} sats`);
  console.log(`Audit Hash: ${result.auditHash}`);
  return result;
}

export { calculateSplits, executeSplits };
