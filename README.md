# GEYSERPULS

**Upgrading Collaborative Crowdfunding on Bitcoin**

GEYSERPULS is the upcoming pulse of decentralized crowdfunding collaboration. Born out of the need for absolute transparency and efficiency within the Bitcoin ecosystem, GEYSERPULS is a next-generation open-source utility designed specifically for community creators, open-source developers, and multi-org charity campaigns running on Geyser Fund.

## Overview

In the decentralized world, teams are fluid. A single project may involve an international group of contributors: frontend developers in Europe, UI designers in South America, and copywriters in Africa. GEYSERPULS eliminates the administrative friction of micro-payouts by creating a trustless, automated routing system directly on top of the Lightning Network. With our platform, joint ownership of a crowdfunding campaign becomes as seamless as a single transaction.

By empowering teams to transparently automate their revenue splits, GEYSERPULS changes the dynamic of crowdfunding from centralized management to open collaboration. We aren't just building a software app; we are upgrading the infrastructure of collaborative value creation on Bitcoin.

## Key Features

- 🔗 **Trustless Payment Routing** - Automated revenue splits on Lightning Network
- 🌍 **Global Collaboration** - Enable international teams to work seamlessly together
- 📊 **Transparent Automation** - Complete visibility into fund distribution
- ⚡ **Lightning Network Integration** - Fast, efficient micro-payments
- 🔓 **Open-Source** - Community-driven development for the Bitcoin ecosystem

## Project Structure

```
GeyserPuls/
├── src/
│   ├── api/              # API endpoints and controllers
│   ├── contracts/        # Smart contracts (if applicable)
│   ├── lightning/        # Lightning Network integration
│   ├── core/             # Core business logic
│   ├── models/           # Data models and schemas
│   ├── utils/            # Utility functions and helpers
│   ├── config/           # Configuration files
│   └── index.ts          # Main entry point
├── tests/                # Test suites
├── docs/                 # Documentation
├── public/               # Static assets (if applicable)
├── .github/
│   └── workflows/        # GitHub Actions workflows
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variables template
├── README.md             # This file
└── LICENSE               # Project license
```

## Tech Stack

- **Bitcoin**: Native Bitcoin integration
- **Lightning Network**: Payment routing and settlement
- **Geyser Fund**: Crowdfunding platform integration
- **TypeScript**: Primary development language
- **Node.js**: Runtime environment

## Getting Started

### Prerequisites
- Node.js >= 18.x
- npm or yarn
- Bitcoin testnet wallet (for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/Lwnguieky/GeyserPuls.git
cd GeyserPuls

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
```

## Development

### Running Tests
```bash
npm run test
```

### Building
```bash
npm run build
```

### Code Style
```bash
npm run lint
npm run format
```


## Roadmap

- [ ] Core API infrastructure
- [ ] Lightning Network integration
- [ ] Geyser Fund API integration
- [ ] Payment splitting logic
- [ ] Web dashboard
- [ ] Smart contract integration (if applicable)
- [ ] Beta testing with pilot communities
- [ ] Mainnet deployment


## Contact & Community

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For general questions and ideas
- **Bitcoin**: Built for the Bitcoin ecosystem, by Bitcoiners

---

**GEYSERPULS** - *Empowering collaborative value creation on Bitcoin*

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
