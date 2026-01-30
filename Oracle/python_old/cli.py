import click
import db
import worker
import aleo
import requests
import config


@click.group()
def cli():
    pass


@cli.command()
@click.argument("market_id")
@click.argument("winning_option", type=int)
def resolve(market_id, winning_option):
    """
    Manually resolves a prediction market.
    """

    if worker.resolve_market(market_id, winning_option):
        db.mark_resolved(market_id)
        click.echo(f"Market {market_id} resolved successfully.")
    else:
        click.echo(f"Failed to resolve market {market_id}.")


@cli.command()
@click.argument("title_field")
@click.argument("threshold", type=float)
@click.argument("snapshot_time", type=int)
@click.option(
    "--metric", 
    default="eth_staking_rate", 
    help="Metric type for resolution (available: 'eth_staking_rate', 'eth_price')."
)
def create_market(title_field, threshold, snapshot_time, metric):
    """
    Creates a new metric-based prediction market and registers it for snapshot.
    
    The Oracle will resolve the market based on the specified metric at the snapshot time.
    """

    if not config.ORACLE_PRIVATE_KEY or not config.ALEO_NODE_URL:
        click.echo("Error: ORACLE_PRIVATE_KEY or ALEO_NODE_URL not found in .env.")
        return

    try:
        # 1. Setup SDK
        private_key = aleo.PrivateKey.from_string(config.ORACLE_PRIVATE_KEY)
        query = aleo.Query.rest(config.ALEO_NODE_URL)
        process = aleo.Process.load()

        # 2. Load program from config (Embedded Mock)
        click.echo(f"📡 Loading embedded program {config.PROGRAM_ID}...")
        program = aleo.Program.from_source(config.PROGRAM_SOURCE)
        process.add_program(program)

        # 3. Authorize create_pool
        click.echo(f"🚀 Authorizing pool creation for {title_field}...")
        function_name = aleo.Identifier.from_string("create_pool")
        
        # Inputs: title (field), description (field), options ([field; 2]), deadline (u64)
        # Using placeholder descriptions and options to match the contract structure
        inputs = [
            aleo.Value.parse(title_field),
            aleo.Value.parse("0field"), # description placeholder
            aleo.Value.parse("[0field, 0field]"), # options placeholder [Yes, No] (index 1, 2 used later)
            aleo.Value.parse(f"{snapshot_time}u64"),
        ]
        auth = process.authorize(private_key, program.id(), function_name, inputs)

        # 4. Execute and Prove
        click.echo("🔧 Generating ZK proof...")
        (_resp, trace) = process.execute(auth)
        trace.prepare(query)
        execution = trace.prove_execution(aleo.Locator(program.id(), function_name))
        execution_id = execution.execution_id()

        # 5. Fee
        fee_cost = config.CREATE_POOL_FEE
        fee_auth = process.authorize_fee_public(
            private_key, fee_cost, execution_id, None
        )
        (_f_resp, fee_trace) = process.execute(fee_auth)
        fee_trace.prepare(query)
        fee = fee_trace.prove_fee()

        # 6. Broadcast
        transaction = aleo.Transaction.from_execution(execution, fee)
        tx_json = transaction.to_json()
        click.echo(f"📡 Broadcasting transaction {execution_id}...")
        response = requests.post(
            config.ALEO_BROADCAST_URL, data=tx_json
        )

        if response.status_code == 200:
            click.echo(
                f"✅ Market creation transaction broadcasted! ID: {response.text.strip()}"
            )
            # Register in backend DB
            db.add_market(title_field, snapshot_time, threshold, metric)
            click.echo(
                f"Market registered in backend DB for snapshot at {snapshot_time}"
            )
        else:
            click.echo(f"❌ Broadcast failed: {response.text}")

    except Exception as e:
        click.echo(f"❌ SDK Error: {e}")


@cli.command()
def start_worker():
    """Starts the background worker for snapshots."""
    click.echo("Starting Oracle Worker...")
    worker.main()


if __name__ == "__main__":
    db.init_db()
    cli()
