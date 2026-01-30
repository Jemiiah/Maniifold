# Manifold

## Project Structure

```
Frontend/
├── app/                          # Next.js App Router
│   ├── globals.css               # Global styles & Tailwind
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Main page component
│
├── components/                   # React components
│   ├── ui/                       # Reusable UI primitives
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   ├── charts.tsx
│   │   └── index.ts
│   ├── market/                   # Market-specific components
│   │   ├── market-card.tsx
│   │   ├── market-filters.tsx
│   │   ├── featured-market.tsx
│   │   ├── trading-panel.tsx
│   │   ├── activity-feed.tsx
│   │   ├── event-detail.tsx
│   │   └── index.ts
│   ├── navbar.tsx
│   ├── footer-stats.tsx
│   └── providers.tsx             # Wagmi & React Query providers
│
├── hooks/                        # Custom React hooks
│   ├── use-markets.ts
│   ├── use-wallet.ts
│   └── index.ts
│
├── lib/                          # Utilities & data
│   ├── utils.ts                  # Helper functions
│   └── data.ts                   # Mock market data
│
├── types/                        # TypeScript definitions
│   └── index.ts
│
├── public/                       # Static assets
│
├── .gitignore
├── components.json               # shadcn/ui config
├── next.config.js
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── wagmi.config.ts               # Wallet configuration
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: Wagmi v2 + Viem
- **State**: React Query + React Hooks
- **Icons**: Lucide React

## Getting Started

```bash
# Install dependencies
bun install
# or
npm install

# Run development server
bun dev
# or
npm run dev

# Build for production
bun run build
# or
npm run build
```

## Features

- **Market Grid** - Filterable cards for all prediction markets
- **Event Detail Page** - Full market info with price history, trading panel, activity feed
- **Wallet Integration** - Ready for Aleo wallet connection via Wagmi
- **Responsive Design** - Mobile, tablet, and desktop support
- **Dark Theme** - Zinc color palette with blue accents

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
```

## Integration Points

The frontend is prepared for Aleo blockchain integration:

1. **Wallet Connection** - Update `wagmi.config.ts` with Aleo chain details
2. **Trading Panel** - Connect to smart contract for order submission
3. **Activity Feed** - Subscribe to on-chain events
4. **Market Data** - Replace mock data in `lib/data.ts` with contract calls
