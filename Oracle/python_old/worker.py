import time

import aleo
import requests

import db
from metrics.registry import registry
import config



def resolve_market(market_id, winning_option):
    """
    Executes the Aleo transaction to resolve the market using the Aleo SDK.
    """
    if not config.ORACLE_PRIVATE_KEY or not config.ALEO_NODE_URL:
        print("❌ Missing Oracle credentials in .env.")
        return False

    try:
        # 1. Setup Oracle Account and Query
        private_key = aleo.PrivateKey.from_string(config.ORACLE_PRIVATE_KEY)
        query = aleo.Query.rest(config.ALEO_NODE_URL)
        process = aleo.Process.load()

        # 2. Load the prediction program from the config (Embedded Mock)
        print(f"📡 Loading embedded program {config.PROGRAM_ID}...")
        program = aleo.Program.from_source(config.PROGRAM_SOURCE)
        process.add_program(program)

        # 3. Authorize Resolution
        print(
            f"🚀 Authorizing resolution for market {market_id} with option {winning_option}..."
        )
        function_name = aleo.Identifier.from_string("resolve_pool")

        # Inputs: market_id (field), winning_option (u64)
        inputs = [
            aleo.Value.parse(market_id),
            aleo.Value.parse(f"{winning_option}u64"),
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
        fee_cost = config.RESOLVE_POOL_FEE 
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

        tx_json = transaction.to_json()
        response = requests.post(
            config.ALEO_BROADCAST_URL, data=tx_json
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
                print(
                    f"⏰ Deadline reached for market: {market_id} (Metric: {metric_type})"
                )

                # Modular Metric Fetching
                handler = registry.get_metric(metric_type)
                if not handler:
                    print(f"❌ No handler found for metric type: {metric_type}")
                    continue

                value = handler.fetch_value()
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
