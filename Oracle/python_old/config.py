import os
from dotenv import load_dotenv

load_dotenv()

ORACLE_PRIVATE_KEY = os.getenv("ORACLE_PRIVATE_KEY")
ALEO_NODE_URL = os.getenv("ALEO_NODE_URL")
ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY")

PROGRAM_ID = "prediction.aleo"
ALEO_BROADCAST_URL = f"{ALEO_NODE_URL}/testnet/transaction/broadcast"

# Costs
CREATE_POOL_FEE = 2_000_000
RESOLVE_POOL_FEE = 1_000_000

# Embedded Program Source (Mock)
PROGRAM_SOURCE = """program predictionprivacyhack.aleo;
record Prediction:
    owner as address.private;
    id as field.private;
    pool_id as field.private;
    option as u64.private;
    amount as u64.private;
    claimed as boolean.private;
struct Pool:
    id as field;
    title as field;
    description as field;
    options as [field; 2u32];
    deadline as u64;
    status as u8;
    winning_option as u64;
    total_staked as u64;
    option_a_stakes as u64;
    option_b_stakes as u64;
struct Default:
    id as u32;
mapping pools:
    key as field.public;
    value as Pool.public;
mapping total_predictions:
    key as field.public;
    value as u64.public;
mapping user_predictions:
    key as address.public;
    value as [field; 1u32].public;
mapping pool_predictions:
    key as field.public;
    value as [field; 1u32].public;
function initialize:
    async initialize self.caller into r0;
    output r0 as predictionprivacyhack.aleo/initialize.future;
finalize initialize:
    input r0 as address.public;
    assert.eq true true;
function main:
function create_pool:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as [field; 2u32].public;
    input r3 as u64.public;
    hash.bhp256 r0 into r4 as field;
    assert.eq self.caller aleo1jl3q3uywtdzlr8dln65xjc2mr7vwa2pm9fsenq49zsgsz5a8pqzs0j7cj5;
    cast r4 r0 r1 r2 r3 0u8 0u64 0u64 0u64 0u64 into r5 as Pool;
    async create_pool r4 r5 into r6;
    output r5 as Pool.private;
    output r6 as predictionprivacyhack.aleo/create_pool.future;
finalize create_pool:
    input r0 as field.public;
    input r1 as Pool.public;
    set 0u64 into total_predictions[r0];
    set r1 into pools[r0];
    cast r0 into r2 as [field; 1u32];
    set r2 into pool_predictions[r0];
function lock_pool:
    input r0 as field.public;
    assert.eq self.caller aleo1jl3q3uywtdzlr8dln65xjc2mr7vwa2pm9fsenq49zsgsz5a8pqzs0j7cj5;
    async lock_pool r0 into r1;
    output r1 as predictionprivacyhack.aleo/lock_pool.future;
finalize lock_pool:
    input r0 as field.public;
    get pools[r0] into r1;
    cast r1.id r1.title r1.description r1.options r1.deadline 1u8 r1.winning_option r1.total_staked r1.option_a_stakes r1.option_b_stakes into r2 as Pool;
    set r2 into pools[r0];
function resolve_pool:
    input r0 as field.public;
    input r1 as u64.public;
    assert.eq self.caller aleo1jl3q3uywtdzlr8dln65xjc2mr7vwa2pm9fsenq49zsgsz5a8pqzs0j7cj5;
    async resolve_pool r0 r1 into r2;
    output r2 as predictionprivacyhack.aleo/resolve_pool.future;
finalize resolve_pool:
    input r0 as field.public;
    input r1 as u64.public;
    get pools[r0] into r2;
    cast r2.id r2.title r2.description r2.options r2.deadline 2u8 r1 r2.total_staked r2.option_a_stakes r2.option_b_stakes into r3 as Pool;
    set r3 into pools[r0];
"""
