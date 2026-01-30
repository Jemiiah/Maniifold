# Aleo Prediction Market Oracle

This service acts as an off-chain oracle for Aleo prediction markets, monitoring market deadlines and fetching real-world data (e.g., ETH price, ETH staking rate) to resolve markets on-chain.

## Features

- **CLI**: Create new prediction markets and manually manage the oracle.
- **Worker**: Periodically monitors pending markets and resolves them upon reaching deadlines.
- **API**: Express-based service for the frontend to fetch market statuses, titles, and descriptions.
- **PostgreSQL Storage**: Reliable database for storing market metadata and off-chain descriptions.

## Prerequisites

- **Node.js**: v18+ (tested on v24)
- **npm run**: Recommended package manager
- **Aleo Account**: Private key with enough credits for fees.
- **PostgreSQL**: v14+ (Local or Remote)
- **Environment Variables**: See `.env.example`.

## Setup

1. Install dependencies:
   ```bash
   npm run install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your private key, Etherscan API key, and PostgreSQL credentials
   ```

## Usage

### 🚀 Running the API
The API provides endpoints for the frontend to query market data.
```bash
npm run api
```
Endpoints:
- `GET /markets`: Fetch all markets including titles and descriptions.
- `GET /markets/pending`: Fetch only pending markets.
- `GET /markets/locked`: Fetch markets currently in the locking phase.

### 🤖 Running the Worker
The worker monitors the database and performs on-chain executions.
```bash
npm run worker
```

### 🛠 Using the CLI
Create new markets with full metadata. **Note**: Use `--` before the command arguments when using `npm run` to ensure flags are passed correctly to the script.

**Example 1: ETH Price Prediction**
```bash
npm run cli -- create-market "ETH-Above-3500" 3500 1738320000 eth_price --description "Will ETH be above $3500 on Feb 1st?" --option-a "ABOVE" --option-b "BELOW"
```

**Example 2: Staking Yield Target**
```bash
npm run cli -- create-market "Yield-High" 4 1738320000 eth_staking_rate --description "Will ETH staking APR exceed 4%?" --option-a "YES" --option-b "NO"
```

**Example 3: Market Cap Flip Check**
```bash
npm run cli -- create-market "BTC-Rank-1" 1 1738320000 generic --description "Will BTC remain the #1 crypto by market cap?" --option-a "REMAINS" --option-b "FLIPPED"
```

**Example 4: Network Congestion**
```bash
npm run cli -- create-market "Gas-Spike" 50 1738320000 generic --description "Will average gwei exceed 50 today?" --option-a "SPIKE" --option-b "STABLE"
```

**Example 5: Governance Vote**
```bash
npm run cli -- create-market "Upgrade-Pass" 1 1738320000 generic --description "Will the privacy upgrade proposal pass?" --option-a "PASSED" --option-b "FAILED"
```

## Project Structure
- `src/api.ts`: Express server implementation.
- `src/worker.ts`: Background monitoring logic.
- `src/cli.ts`: Command-line interface.
- `src/db.ts`: PostgreSQL database utilities.
- `src/metrics/`: Data fetching handlers for different metric types.
