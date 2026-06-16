# PayScript

> x402 micropayment paywalls for APIs and digital tools — built on Stellar Soroban

---

## Problem

A Cebu-based developer selling an AI dataset tool earns $0 from 400 monthly API users because there's no sub-$1 payment layer that works across borders. Stripe requires a US entity, PayPal takes 5–7%, and crypto wallets scare non-technical buyers away.

## Solution

PayScript lets any developer wrap their API behind a Soroban-verified micropayment wall. The buyer connects a Freighter wallet, pays XLM (as little as $0.01 per call), and receives on-chain credits — unlocking API access in under 5 seconds. Fees are under $0.001. No intermediaries. No geography restrictions.

**Why Stellar is essential:** Sub-cent transaction fees make per-call micropayments economically viable for the first time. XLM settles in 3–5 seconds. Soroban smart contracts handle credit verification trustlessly, without a centralized backend holding funds.

---

## Architecture

```
Buyer (Freighter Wallet)
        │
        ▼ signs XLM payment tx
Stellar Network (Horizon API)
        │
        ▼ payment confirmed → calls contract
PayScript Soroban Contract (lib.rs)
    ├── register_api()     → Developer registers API + price
    ├── purchase_credits() → Buyer pays → credits stored on-chain
    ├── verify_access()    → Deducts 1 credit → emits access event
    ├── get_credits()      → Frontend reads buyer balance
    └── get_revenue()      → Developer dashboard reads earnings
        │
        ▼ access event emitted
Next.js Frontend (Vercel)
    └── Listens via Horizon event stream → unlocks API key in UI
```

### Inter-Contract Communication
`verify_access()` is designed to be called by an external `AccessRegistry` contract, satisfying Soroban's inter-contract communication pattern. The registry contract calls `PayScriptContract::verify_access()` before granting downstream API permissions.

---

## Stellar Features Used

| Feature | Usage |
|---|---|
| XLM transfers | Payment from buyer to contract (via Freighter) |
| Soroban smart contracts | Credit ledger, access verification, revenue tracking |
| Soroban events | Real-time purchase and access notifications to frontend |
| Horizon API | Frontend polls for payment confirmation and event streaming |
| Freighter wallet | Browser-based signing — no seed phrase exposure |

---

## Vision & Purpose

PayScript is the monetization primitive that Stellar's developer ecosystem is missing. As x402 agentic payment rails mature, any AI agent or API tool will need a trustless, sub-cent payment layer. PayScript is that layer — starting with human buyers, expanding to autonomous agents.

**Target users:** Independent developers and API creators in Southeast Asia (Philippines, Indonesia, Vietnam) earning under $2,000/month from digital tools, who have working products but no viable micropayment layer.

**Level 7 roadmap:**
- GCash/Maya anchor integration (SEP-24) — buyers top up with fiat, no crypto knowledge needed
- x402 protocol integration for autonomous agent payments
- AccessRegistry inter-contract for multi-API dashboards
- Partnership with Philippine developer communities (Devcon PH, Stellar SEA)

---

## Timeline

| Phase | Scope |
|---|---|
| Week 1 | Soroban contract + testnet deployment |
| Week 2 | Inter-contract calls + event streaming + Next.js scaffold |
| Week 3 | CI/CD + tests + Freighter wallet integration |
| Week 4 | README + demo video + Vercel deployment + submission |

---

## Prerequisites

- **Rust:** `curl https://sh.rustup.rs -sSf | sh`
- **Soroban CLI:** `cargo install --locked soroban-cli --features opt`
  - Tested with: `soroban-cli 21.x`
- **Stellar Testnet account:** [https://laboratory.stellar.org/#account-creator](https://laboratory.stellar.org/#account-creator)
- **Node.js 18+** (for frontend)
- **Freighter wallet:** [https://freighter.app](https://freighter.app)

---

## Build

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/payscript
cd payscript/contracts/payscript

# Build the Wasm contract
soroban contract build

# Output will be at:
# target/wasm32-unknown-unknown/release/payscript.wasm
```

---

## Test

```bash
cd contracts/payscript

# Run all 5 tests
cargo test

# Expected output:
# test tests::test_happy_path_full_mvp_flow ... ok
# test tests::test_access_denied_with_zero_credits ... ok
# test tests::test_state_correct_after_purchase ... ok
# test tests::test_insufficient_payment_rejected ... ok
# test tests::test_credits_accumulate_across_purchases ... ok
#
# test result: ok. 5 passed; 0 failed
```

---

## Deploy to Testnet

```bash
# 1. Set up your testnet identity (skip if already done)
soroban keys generate --global deployer --network testnet

# 2. Fund your testnet account
soroban keys fund deployer --network testnet

# 3. Deploy the contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payscript.wasm \
  --source deployer \
  --network testnet

# Output: CONTRACT_ID (save this — it goes in your .env)
# Example: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN

# 4. Initialize the contract with your admin address
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin <YOUR_STELLAR_ADDRESS>
```

---

## Sample CLI Invocations

### Register an API (developer)
```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- \
  register_api \
  --owner GDEVELOPERGXAMPLEADDRESS123456789ABCDEFGHIJKLMNOPQRST \
  --api_key MYAPI \
  --price_per_call 100000
# 100000 stroops = 0.01 XLM per call
```

### Purchase credits (buyer)
```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source buyer-key \
  --network testnet \
  -- \
  purchase_credits \
  --buyer GBUYERADDRESSGXAMPLEADDRESS123456789ABCDEFGHIJKLMNOPQRST \
  --api_key MYAPI \
  --amount_paid 1000000
# 1000000 stroops = 0.1 XLM = 10 credits at 0.01 XLM/call
```

### Check credit balance
```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_credits \
  --buyer GBUYERADDRESSGXAMPLEADDRESS123456789ABCDEFGHIJKLMNOPQRST
# Output: 10
```

### Verify API access (deducts 1 credit)
```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source buyer-key \
  --network testnet \
  -- \
  verify_access \
  --buyer GBUYERADDRESSGXAMPLEADDRESS123456789ABCDEFGHIJKLMNOPQRST \
  --api_key MYAPI
# Output: true
```

### Check API revenue (developer dashboard)
```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_revenue \
  --api_key MYAPI
# Output: 1000000 (stroops)
```

---

## Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.example .env.local
# Add CONTRACT_ID and STELLAR_NETWORK=testnet to .env.local

npm run dev
# Runs on http://localhost:3000
```

**Live demo:** [https://payscript.vercel.app](https://payscript.vercel.app)

---

## Contract Addresses (Testnet)

| Contract | Address |
|---|---|
| PayScript Core | *(added after deployment)* |
| AccessRegistry | *(added after deployment)* |

**Transaction hash (first contract interaction):** *(added after deployment)*

---

## CI/CD

GitHub Actions pipeline runs on every push to `main`:
1. `cargo test` — runs all 5 Soroban contract tests
2. `npm test` — runs frontend tests
3. Auto-deploys to Vercel on green build

See `.github/workflows/ci.yml` for the full pipeline config.

---

## Project Structure

```
payscript/
├── contracts/
│   └── payscript/
│       ├── src/
│       │   ├── lib.rs      # Soroban smart contract
│       │   └── test.rs     # 5 contract tests
│       └── Cargo.toml
├── frontend/
│   ├── pages/
│   │   ├── index.tsx       # Developer dashboard
│   │   └── pay/[apiKey].tsx # Buyer payment page
│   ├── components/
│   │   ├── WalletConnect.tsx
│   │   ├── CreditBalance.tsx
│   │   └── PurchaseForm.tsx
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml
└── README.md
```

---

## License

MIT © 2025 PayScript Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.