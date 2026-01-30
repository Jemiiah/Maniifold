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

async function resolveMarket(marketId: string, winningOption: number): Promise<boolean> {
    if (!ORACLE_PRIVATE_KEY || !ALEO_NODE_URL) {
        console.error("❌ Missing Oracle credentials in .env.");
        return false;
    }

    try {
        const stringToField = (str: string): string => {
            const buffer = Buffer.from(str, "utf8");
            let hex = buffer.toString("hex");
            if (buffer.length > 31) hex = buffer.subarray(0, 31).toString("hex");
            const bigInt = BigInt("0x" + hex);
            return `${bigInt}field`;
        };

        console.log(`📡 Loading embedded program ${PROGRAM_ID}...`);
        // Assuming program source handling is done via imports or deployment if needed.
        // The SDK executes against the network/cache.

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
    db.initDb();
    console.log("🤖 Oracle Worker is running and monitoring pending markets...");

    setInterval(async () => {
        try {
            const pending = await db.getPendingMarkets();
            const currentTime = Math.floor(Date.now() / 1000);

            for (const market of pending) {
                const { market_id, deadline, threshold, metric_type } = market;

                if (currentTime >= deadline) {
                    console.log(
                        `⏰ Deadline reached for market: ${market_id} (Metric: ${metric_type})`
                    );

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
                            db.markResolved(market_id);
                            console.log(
                                `✅ Market ${market_id} resolved as ${winningOption === 1 ? "YES" : "NO"
                                }`
                            );
                        }
                    } else {
                        console.log(
                            `⚠️ Could not fetch data for market ${market_id}, retrying next loop...`
                        );
                    }
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
