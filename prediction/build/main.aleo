program predictionprivacyhack.aleo;

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

function predict:
    input r0 as field.private;
    input r1 as u64.private;
    input r2 as u64.private;
    input r3 as u64.private;
    is.eq r1 1u64 into r4;
    is.eq r1 2u64 into r5;
    or r4 r5 into r6;
    assert.eq r6 true;
    assert.neq r2 0u64;
    hash.bhp256 r3 into r7 as field;
    cast self.caller r7 r0 r1 r2 false into r8 as Prediction.record;
    ternary r4 r2 0u64 into r9;
    ternary r4 0u64 r2 into r10;
    async predict r0 r7 r2 r1 r9 r10 into r11;
    output r8 as Prediction.record;
    output r11 as predictionprivacyhack.aleo/predict.future;

finalize predict:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as u64.public;
    input r3 as u64.public;
    input r4 as u64.public;
    input r5 as u64.public;
    contains pools[r0] into r6;
    assert.eq r6 true;
    get pools[r0] into r7;
    assert.eq r7.status 0u8;
    cast block.timestamp into r8 as u64;
    gt r7.deadline r8 into r9;
    assert.eq r9 true;
    add r7.total_staked r2 into r10;
    add r7.option_a_stakes r4 into r11;
    add r7.option_b_stakes r5 into r12;
    cast r7.id r7.title r7.description r7.options r7.deadline r7.status r7.winning_option r10 r11 r12 into r13 as Pool;
    set r13 into pools[r0];
    cast r1 into r14 as [field; 1u32];
    set r14 into pool_predictions[r0];
    get total_predictions[r0] into r15;
    add r15 1u64 into r16;
    set r16 into total_predictions[r0];

constructor:
    assert.eq program_owner aleo1jl3q3uywtdzlr8dln65xjc2mr7vwa2pm9fsenq49zsgsz5a8pqzs0j7cj5;
