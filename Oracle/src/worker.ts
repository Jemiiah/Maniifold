import "@provablehq/sdk/testnet.js";
import {
    Account,
    AleoNetworkClient,
    NetworkRecordProvider,
    ProgramManager,
    AleoKeyProvider,
    initThreadPool,
} from "@provablehq/sdk";
import * as db from "./db.js";
import { registry } from "./metrics/registry.js";
import {
    ORACLE_PRIVATE_KEY,
    ALEO_NODE_URL,
    PROGRAM_ID,
    PROGRAM_SOURCE,
    LOCK_POOL_FEE,
    RESOLVE_POOL_FEE,
} from "./config.js";

// Setup SDK
const account = new Account({ privateKey: ORACLE_PRIVATE_KEY });
const networkClient = new AleoNetworkClient(ALEO_NODE_URL);
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

const programManager = new ProgramManager(
    ALEO_NODE_URL,
    keyProvider,
    recordProvider
);

programManager.setAccount(account);

const stringToField = (str: string): string => {
    const buffer = Buffer.from(str, "utf8");
    let hex = buffer.toString("hex");
    if (buffer.length > 31) hex = buffer.subarray(0, 31).toString("hex");
    const bigInt = BigInt("0x" + hex);
    return `${bigInt}field`;
};

async function syncOnChainData() {
    console.log("🔄 Syncing on-chain market data...");
    const allMarkets = await db.getAllMarkets();

    for (const market of allMarkets) {
        const { market_id } = market;
        try {
            const marketIdField = stringToField(market_id);
            // Query the 'pools' mapping in the program
            const poolData: any = await networkClient.getProgramMappingValue(
                PROGRAM_ID,
                "pools",
                marketIdField
            );

            if (poolData) {
                console.log(`📊 Fetched on-chain data for ${market_id}`);


                const totalStakedMatch = poolData.match(/total_staked:\s*(\d+)u64/);
                const optionAStakesMatch = poolData.match(/option_a_stakes:\s*(\d+)u64/);
                const optionBStakesMatch = poolData.match(/option_b_stakes:\s*(\d+)u64/);

                if (totalStakedMatch && optionAStakesMatch && optionBStakesMatch) {
                    const totalStaked = parseInt(totalStakedMatch[1]);
                    const optionAStakes = parseInt(optionAStakesMatch[1]);
                    const optionBStakes = parseInt(optionBStakesMatch[1]);

                    await db.updateMarketStats(market_id, totalStaked, optionAStakes, optionBStakes);
                }
            }
        } catch (e: any) {
            if (!e.message.includes("not found")) {
                console.error(`❌ Error syncing data for ${market_id}: ${e.message}`);
            }
        }
    }
}

async function lockMarket(marketId: string): Promise<boolean> {
    if (!ORACLE_PRIVATE_KEY || !ALEO_NODE_URL) {
        console.error("❌ Missing Oracle credentials in .env.");
        return false;
    }

    try {
        console.log(`🔒 Authorizing lock for market ${marketId}...`);

        const marketIdField = stringToField(marketId);
        const inputs = [marketIdField];
        const fee = LOCK_POOL_FEE / 1_000_000;

        const executionResponse = await programManager.execute({
            programName: PROGRAM_ID,
            functionName: "lock_pool",
            priorityFee: fee,
            privateFee: false,
            inputs: inputs,
            program: PROGRAM_SOURCE,
            keySearchParams: { cacheKey: `${PROGRAM_ID}:lock_pool` }
        });

        console.log(`✅ Lock Transaction Broadcasted! ID: ${executionResponse}`);
        return true;
    } catch (e: any) {
        console.error(`❌ SDK Error during locking: ${e.message}`);
        return false;
    }
}

async function resolveMarket(marketId: string, winningOption: number): Promise<boolean> {
    if (!ORACLE_PRIVATE_KEY || !ALEO_NODE_URL) {
        console.error("❌ Missing Oracle credentials in .env.");
        return false;
    }

    try {
        console.log(
            `🚀 Authorizing resolution for market ${marketId} with option ${winningOption}...`
        );

        const marketIdField = stringToField(marketId);
        const inputs = [marketIdField, `${winningOption}u64`];
        const fee = RESOLVE_POOL_FEE / 1_000_000;

        const executionResponse = await programManager.execute({
            programName: PROGRAM_ID,
            functionName: "resolve_pool",
            priorityFee: fee,
            privateFee: false,
            inputs: inputs,
            program: PROGRAM_SOURCE,
            keySearchParams: { cacheKey: `${PROGRAM_ID}:resolve_pool` }
        });

        console.log(`✅ Transaction Broadcasted! ID: ${executionResponse}`);
        return true;
    } catch (e: any) {
        console.error(`❌ SDK Error during resolution: ${e.message}`);
        return false;
    }
}

export async function startWorker() {
    await initThreadPool();
    await db.initDb();
    console.log("🤖 Oracle Worker is running and monitoring pending markets...");

    setInterval(async () => {
        try {
            const currentTime = Math.floor(Date.now() / 1000);

            // 0. Sync on-chain stats (TVL, stakes)
            await syncOnChainData();

            // 1. Handle Pending -> Locked
            const pending = await db.getPendingMarkets();
            for (const market of pending) {
                const { market_id, deadline } = market;
                if (currentTime >= deadline) {
                    console.log(`⏰ Deadline reached for market: ${market_id}. Locking...`);
                    const success = await lockMarket(market_id);
                    if (success) {
                        await db.markLocked(market_id);
                    }
                }
            }

            // 2. Handle Locked -> Resolved
            const locked = await db.getLockedMarkets();
            for (const market of locked) {
                const { market_id, threshold, metric_type } = market;

                console.log(`🔎 Resolution check for locked market: ${market_id} (Metric: ${metric_type})`);

                const handler = registry.getMetric(metric_type);
                if (!handler) {
                    console.error(`❌ No handler found for metric type: ${metric_type}`);
                    continue;
                }

                const value = await handler.fetchValue();
                if (value !== null) {
                    const winningOption = value >= threshold ? 1 : 2;

                    const success = await resolveMarket(market_id, winningOption);
                    if (success) {
                        await db.markResolved(market_id);
                        console.log(
                            `✅ Market ${market_id} resolved as ${winningOption === 1 ? "YES" : "NO"}`
                        );
                    }
                } else {
                    console.log(`⚠️ Could not fetch data for market ${market_id}, retrying next loop...`);
                }
            }
        } catch (e: any) {
            console.error("Error in worker loop:", e.message);
        }
    }, 60000); // 60 seconds
}

// Start worker if run directly
import { fileURLToPath } from "url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    startWorker().catch(console.error);
}
