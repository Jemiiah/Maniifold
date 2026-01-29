import time
import os
import aleo
import requests
from dotenv import load_dotenv
import db

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

ORACLE_PRIVATE_KEY = os.getenv("ORACLE_PRIVATE_KEY")
ALEO_NODE_URL = os.getenv("ALEO_NODE_URL")


def fetch_eth_staking_data():
    """
    Fetches ETH staking rate (total_staked / total_supply).
    Yields a percentage value (e.g., 28.5).
    """
    try:
        # In a real implementation, you would uses APIs like:
        # - Etherscan: Total Supply
        # - Beaconcha.in: Total Staked

        # For demonstration, we use sample values or a public API if available.
        # This is the "Snapshot" logic described by the user.

        # total_supply_url = "https://api.etherscan.io/api?module=stats&action=ethsupply&apikey=YOUR_API_KEY"
        # total_staked_url = "https://api.beaconcha.in/v1/validator/statistics"

        # Mock logic representing the "frozen value" at snapshot time
        # In production, this would be a real GET request.
        print("📸 Taking snapshot of ETH staking data...")

        # Sample data as of early 2026/late 2025 projection
        total_staked = 34500000  # Example: 34.5M ETH staked
        total_supply = 120000000  # Example: 120M ETH total supply

        staking_rate = (total_staked / total_supply) * 100
        print(f"📊 Snapshot Value: {staking_rate:.2f}%")

        return staking_rate
    except Exception as e:
        print(f"❌ Error fetching staking data: {e}")
        return None


def resolve_market(market_id, winning_option):
    """
    Executes the Aleo transaction to resolve the market using the Aleo SDK.
    """

    if not ORACLE_PRIVATE_KEY or not ALEO_NODE_URL:
        print("❌ Missing Oracle credentials in .env.")
        return False

    try:
        # 1. Setup Oracle Account and Query
        private_key = aleo.PrivateKey.from_string(ORACLE_PRIVATE_KEY)
        query = aleo.Query.rest(ALEO_NODE_URL)
        process = aleo.Process.load()

        # 2. Load the prediction program from the network
        program_id = "prediction.aleo"
        print(f"📡 Fetching program {program_id} from the network...")
        program_source = query.get_program(program_id)
        
        program = aleo.Program.from_string(program_source)
        process.add_program(program)

        # 3. Authorize Resolution
        print(
            f"🚀 Authorizing resolution for market {market_id} with option {winning_option}..."
        )
        function_name = aleo.Identifier.from_string("resolve_pool")

        # Inputs: market_id (field), winning_option (u64)
        inputs = [
            aleo.Value.from_string(market_id),
            aleo.Value.from_string(f"{winning_option}u64"),
        ]

        auth = process.authorize(private_key, program.id(), function_name, inputs)

        # 4. Execute and Prove
        print("🔧 Generating zero-knowledge proof...")
        (resp, trace) = process.execute(auth)
        trace.prepare(query)

        execution = trace.prove_execution(aleo.Locator(program.id(), function_name))
        execution_id = execution.execution_id()
        process.verify_execution(execution)

        # 5. Handle Fees (Public Fee)
        # For simplicity, we use a fixed fee or calculate it if costs are known
        # In a real environment, you'd check process.execution_cost(execution)
        fee_cost = 100_000  # Example fee in microcredits
        fee_auth = process.authorize_fee_public(
            private_key, fee_cost, execution_id, None
        )
        (_fee_resp, fee_trace) = process.execute(fee_auth)
        fee_trace.prepare(query)
        fee = fee_trace.prove_fee()
        process.verify_fee(fee, execution_id)

        # 6. Create and Broadcast Transaction
        transaction = aleo.Transaction.from_execution(execution, fee)
        print(f"📡 Broadcasting transaction {execution_id}...")

        # Use query to broadcast
        # Note: If Query doesn't have a direct broadcast, we'd use requests to POST to the node's /transaction/broadcast endpoint
        tx_json = transaction.to_json()
        response = requests.post(
            f"{ALEO_NODE_URL}/testnet3/transaction/broadcast", data=tx_json
        )

        if response.status_code == 200:
            print(f"✅ Transaction Broadcasted! ID: {response.text.strip()}")
            return True
        else:
            print(f"❌ Broadcast failed: {response.text}")
            return False

    except Exception as e:
        print(f"❌ SDK Error during resolution: {e}")
        return False


def main():
    db.init_db()
    print("🤖 Oracle Worker is running and monitoring pending markets...")

    while True:
        pending = db.get_pending_markets()
        current_time = int(time.time())

        for market_id, deadline, threshold, metric_type in pending:
            if current_time >= deadline:
                print(f"⏰ Deadline reached for market: {market_id}")

                value = fetch_eth_staking_data()
                if value is not None:
                    # Resolve: Option 1 (Yes) if value >= threshold, Option 2 (No) otherwise
                    winning_option = 1 if value >= threshold else 2

                    if resolve_market(market_id, winning_option):
                        db.mark_resolved(market_id)
                        print(
                            f"✅ Market {market_id} resolved as {'YES' if winning_option == 1 else 'NO'}"
                        )
                else:
                    print(
                        f"⚠️ Could not fetch data for market {market_id}, retrying next loop..."
                    )

        # Poll every 60 seconds
        time.sleep(60)


if __name__ == "__main__":
    main()
