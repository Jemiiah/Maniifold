# BlockSeer Frontend

Next.js 14 web app for BlockSeer prediction markets on Aleo.

## Project Structure

```
Frontend/
├── app/
│   ├── admin/page.tsx            # Admin market creation (wallet-gated)
│   ├── api/markets/              # API routes for market data
│   ├── market/[id]/              # Market detail page
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Home — market grid & portfolio
│
├── components/
│   ├── ui/                       # Reusable UI primitives (button, badge, charts)
│   ├── market/                   # Market-specific components
│   │   ├── market-card.tsx       # Market card for grid view
│   │   ├── market-filters.tsx    # Filter bar (all/live/upcoming)
│   │   ├── featured-market.tsx   # Featured market banner
│   │   ├── trading-panel.tsx     # Order placement with wallet integration
│   │   ├── activity-feed.tsx     # Transaction activity
│   │   └── event-detail.tsx      # Full market detail view
│   ├── navbar.tsx                # Top nav with wallet connect & search
│   ├── portfolio.tsx             # Portfolio view with user predictions
│   └── providers.tsx             # AleoWalletProvider & React Query setup
│
├── hooks/
│   ├── use-prediction.ts         # Submit predictions via executeTransaction
│   ├── use-user-predictions.ts   # Fetch user's private prediction records
│   ├── use-on-chain-pool.ts      # Fetch on-chain pool state
│   ├── use-aleo-pools.ts         # Fetch all pools from backend
│   ├── use-markets.ts            # Market filtering & search logic
│   └── use-wallet.ts             # Wallet utilities
│
├── lib/
│   ├── aleo-client.ts            # Aleo REST API client (mapping queries)
│   ├── api-client.ts             # Backend API client
│   ├── utils.ts                  # Helpers (odds calculation, formatting)
│   └── data.ts                   # Market metadata
│
└── types/index.ts                # TypeScript definitions
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Wallet:** @provablehq/aleo-wallet-adaptor-* (v0.3.0-alpha)
- **State:** React Query + React hooks
- **Icons:** Lucide React

## Wallet Integration

Uses `@provablehq/aleo-wallet-adaptor-*` packages with three wallet adapters:

| Wallet | Adapter | Package |
|---|---|---|
| Shield (Galileo) | `ShieldWalletAdapter` | `@provablehq/aleo-wallet-adaptor-shield` |
| Leo Wallet | `LeoWalletAdapter` | `@provablehq/aleo-wallet-adaptor-leo` |
| Puzzle Wallet | `PuzzleWalletAdapter` | `@provablehq/aleo-wallet-adaptor-puzzle` |

**Key API:**
- `useWallet()` returns `{ address, connected, executeTransaction, requestRecords, disconnect }`
- Transactions use `executeTransaction({ program, function, inputs, fee, privateFee })`
- Record fetching uses `requestRecords(programId, true)` for decrypted plaintexts

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Features

- **Market Grid** — Filterable, searchable cards for all prediction markets
- **On-Chain Data** — Live pool stakes and pari-mutuel odds from Aleo testnet
- **Trading Panel** — Place predictions with real `executeTransaction` calls
- **Portfolio** — View your private prediction records via `requestRecords`
- **Admin Panel** — Create markets (wallet-gated to admin address)
- **Responsive** — Mobile, tablet, and desktop with dark theme
