# GeyserPuls

**Empowering collaborative value creation on Bitcoin**

GeyserPuls is a collaborative funding platform that enables transparent, automated revenue sharing for creative teams on Bitcoin / Lightning Network.

Built for the Geyser ecosystem. Teams create together, get funded together, and get paid together - automatically, fairly, and on-chain verifiable.

## Problem

Creative teams on Geyser struggle to split funds fairly. Manual splits are slow, unfair, and non-transparent. Who gets what? When? How to prove it?

## Solution

GeyserPuls automates the split:

1. Team defines shares (e.g. Creator 60%, Dev 25%, Designer 15%)
2. Funder sends Bitcoin to campaign
3. GeyserPuls calculates fair split instantly
4. Lightning payments go out automatically to each member
5. Anyone can audit via Audit Hash

## How Split Works

Professional split engine in `src/core/splitter.ts`:

- **Validation:** Shares must sum to 10000 bps (100%)
- **Largest Remainder Method:** Fair distribution of rounding sats
- **Fee Cap:** Aborts if Lightning fee exceeds cap
- **Pending Ledger:** Accumulates payouts below minimum
- **Idempotency:** SHA256 key prevents double-payments
- **Retry:** Exponential backoff (1s, 2s, 4s, 8s) + Dead Letter Queue
- **Audit Hash:** Anyone can verify distribution

See implementation: [`src/core/splitter.ts`](src/core/splitter.ts)
See tests: [`tests/Splitter.test.ts`](tests/Splitter.test.ts)
See entry: [`src/index.ts`](src/index.ts)

## Status - Implementation Done

### Core Engine - DONE
- [x] Payment splitting logic - `src/core/splitter.ts`
- [x] Largest Remainder Method - fair rounding
- [x] Fee Cap protection
- [x] Pending Ledger for dust / min payouts
- [x] Idempotency - no double payments
- [x] Retry with exponential backoff
- [x] Audit Hash for verification

### Tests - DONE
- [x] Split calculation tests - `tests/Splitter.test.ts`
- [x] Validation tests (shares must sum to 100%)
- [x] Fee cap tests
- [x] Pending payout tests

### API - IN PROGRESS
- [x] Entry point - `src/index.ts`
- [ ] Lightning Network integration
- [ ] Geyser API integration

## Tech Stack

- TypeScript
- Bitcoin / Lightning Network
- Node.js

## Roadmap

- [x] Core split engine
- [x] Tests
- [ ] Lightning integration
- [ ] Geyser API
- [ ] Frontend dashboard
- [ ] Mainnet launch

## License

MIT
