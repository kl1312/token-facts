# token-facts

Self-hosted token facts for Solana, Ethereum, and BSC. Reads chain RPC only. Shows the table. Does not score, label, or tell you to buy.

## What it shows

| Field | Solana | Ethereum / BSC |
|---|---|---|
| Address | mint | contract |
| Name / symbol | not in v0 | `name()` / `symbol()` |
| Decimals / supply | mint account | `decimals()` / `totalSupply()` |
| Mint / freeze authority | mint account | — |
| Owner | — | `owner()` |
| Top holders | `getTokenLargestAccounts` | not in v0 |

Every row is labeled `on-chain`. Authority or owner still set is red. Revoked, zero address, or no `owner()` is green.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Try:

- Solana USDC `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- Ethereum USDC `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`

`GET /api/basic?address=&chain=` returns the same JSON the page renders. `chain` is `solana`, `ethereum`, or `bsc`.

Public RPC is fine for a small VPS. On HTTP 429 the route returns the last cached value if one exists. It does not retry.

## Not included

No RugCheck, GoPlus, DexScreener, or honeypot calls. No risk score. No AI writeup. Solana name and symbol, and EVM pair reserves, are later work.
