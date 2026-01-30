import "@provablehq/sdk/testnet.js";
import { Command } from "commander";
import {
    Account,
    AleoNetworkClient,
    NetworkRecordProvider,
    ProgramManager,
    AleoKeyProvider,
    initThreadPool,
} from "@provablehq/sdk";
import * as db from "./db.js";
import { startWorker } from "./worker.js";
import {
    ORACLE_PRIVATE_KEY,
    ALEO_NODE_URL,
    PROGRAM_ID,
    CREATE_POOL_FEE,
    PROGRAM_SOURCE,
} from "./config.js";

const program = new Command();

program
    .name("oracle")
    .description("Oracle CLI for Prediction Markets")
    .version("1.0.0");

async function setupSDK() {
    if (!ORACLE_PRIVATE_KEY || !ALEO_NODE_URL) {
        throw new Error("Missing Oracle credentials in .env");
    }
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
    await initThreadPool();
    return { programManager };
}

program
    .command("create-market")
    .description("Create a new prediction market")
    .argument("<title>", "Title of the market")
    .argument("<threshold>", "Threshold value")
    .argument("<snapshot_time>", "Snapshot timestamp (Unix seconds)")
    .argument("[metric]", "Metric type (default: eth_staking_rate)")
    .option("-d, --description <text>", "Description of the market", "")
    .option("--option-a <text>", "Label for Option A", "YES")
    .option("--option-b <text>", "Label for Option B", "NO")
    .action(async (title, threshold, snapshotTime, metric, options) => {
        const selectedMetric = metric || "eth_staking_rate";
        const description = options.description;
        const optionA = options.optionA;
        const optionB = options.optionB;

        const stringToField = (str: string): string => {
            const buffer = Buffer.from(str, "utf8");
            let hex = buffer.toString("hex");
            if (buffer.length > 31) hex = buffer.subarray(0, 31).toString("hex");
            const bigInt = BigInt("0x" + hex);
            return `${bigInt}field`;
        };

        try {
            await db.initDb();
            const { programManager } = await setupSDK();

            console.log(`🚀 Authorizing pool creation for ${title}...`);

            const titleField = stringToField(title);
            const descriptionField = stringToField(description);
            const optionAField = stringToField(optionA);
            const optionBField = stringToField(optionB);

            const inputs = [
                titleField,
                "0field",
                "[0field, 0field]",
                `${snapshotTime}u64`,
            ];
            const fee = CREATE_POOL_FEE / 1_000_000;

            const txId = await programManager.execute({
                programName: PROGRAM_ID,
                functionName: "create_pool",
                priorityFee: fee,
                privateFee: false,
                inputs: inputs,
                program: PROGRAM_SOURCE,
                keySearchParams: { cacheKey: `${PROGRAM_ID}:${"create_pool"}` }
            });

            console.log(`✅ Market creation transaction broadcasted! ID: ${txId}`);

            // Register in backend DB
            await db.addMarket(titleField, title, parseInt(snapshotTime), parseFloat(threshold), selectedMetric, description, optionA, optionB);
            console.log(`Market registered in backend DB for snapshot at ${snapshotTime}`);

        } catch (e: any) {
            console.error(`❌ Error creating market: ${e.message}`);
        }
    });

program
    .command("start-worker")
    .description("Start the Oracle Worker")
    .action(async () => {
        await startWorker();
    });

program.parse(process.argv);
