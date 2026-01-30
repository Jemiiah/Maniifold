# Aleo Prediction Market Oracle

This service acts as an off-chain oracle for Aleo prediction markets, monitoring market deadlines and fetching real-world data (e.g., ETH price, ETH staking rate) to resolve markets on-chain.

## Features

- **CLI**: Create new prediction markets and manually manage the oracle.
- **Worker**: Periodically monitors pending markets and resolves them upon reaching deadlines.
- **API**: Express-based service for the frontend to fetch market statuses, titles, and descriptions.
- **PostgreSQL Storage**: Reliable database for storing market metadata and off-chain descriptions.

## Prerequisites

- **Node.js**: v18+ (tested on v24)
- **Yarn**: Recommended package manager
- **Aleo Account**: Private key with enough credits for fees.
- **PostgreSQL**: v14+ (Local or Remote)
- **Environment Variables**: See `.env.example`.

## Setup

1. Install dependencies:
   ```bash
   yarn install
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
yarn api
```
Endpoints:
- `GET /markets`: Fetch all markets including titles and descriptions.
- `GET /markets/pending`: Fetch only pending markets.
- `GET /markets/locked`: Fetch markets currently in the locking phase.

### 🤖 Running the Worker
The worker monitors the database and performs on-chain executions.
```bash
yarn worker
```

### 🛠 Using the CLI
Create new markets with off-chain descriptions.
```bash
yarn cli create-market "ETH-Over-4000" 4000 1738224000 eth_price --description "Will ETH price be over $4000 on Jan 30th?"
```

## Project Structure
- `src/api.ts`: Express server implementation.
- `src/worker.ts`: Background monitoring logic.
- `src/cli.ts`: Command-line interface.
- `src/db.ts`: PostgreSQL database utilities.
- `src/metrics/`: Data fetching handlers for different metric types.
