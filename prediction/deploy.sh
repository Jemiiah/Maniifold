#!/bin/bash

echo "🚀 Starting PrivaFlow Deployment..."

command -v leo >/dev/null 2>&1 || { echo "❌ Leo CLI not found. Please install Leo SDK.";  }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Please install Node.js v18+.";  }

if [ -f .env ]; then
    echo "📄 Loading environment variables..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: .env file not found. Ensure PRIVATE_KEY is set in your shell."
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📦 Building and Deploying PrivaFlow Contracts...${NC}"

cd program || {
    echo -e "${RED}❌ 'program' directory not found${NC}"
    
}

echo "   Building..."
leo clean
leo build || {
    echo -e "${RED}❌ Failed to build privaflow_v2.aleo${NC}"
    
}

echo -e "${YELLOW}🌐 Deploying privaflow_v2.aleo to Testnet...${NC}"

leo deploy --network testnet --endpoint https://api.explorer.provable.com/v1 --broadcast --save "./deploy_tx" --print || {
    echo -e "${RED}❌ Failed to deploy privaflow_v2.aleo${NC}"
    
}

echo -e "${GREEN}✅ Main contract deployed successfully${NC}"

echo -e "${YELLOW}⚙️  Initializing Treasury...${NC}"

leo execute initialize --network testnet --endpoint https://api.explorer.provable.com/v1 --broadcast || {
    echo -e "${RED}❌ Failed to initialize treasury${NC}"
    
}

echo -e "${GREEN}✅ Treasury initialized successfully${NC}"