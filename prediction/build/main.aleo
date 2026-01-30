program predictionprivacyhackviii.aleo;

record credits:
    owner as address.private;
    microcredits as u64.private;

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
    total_no_of_stakes as u64;
    total_no_of_stakes_option_a as u64;
    total_no_of_stakes_option_b as u64;

struct Default:
    id as u32;

mapping pools:
    key as field.public;
    value as Pool.public;

mapping total_predictions:
    key as field.public;
    value as u64.public;

mapping pools_id__:
    key as u32.public;
    value as field.public;

mapping pools_id__len__:
    key as boolean.public;
    value as u32.public;

mapping user_predictions__:
    key as u32.public;
    value as field.public;

mapping user_predictions__len__:
    key as boolean.public;
    value as u32.public;

function initialize:
    async initialize self.caller into r0;
    output r0 as predictionprivacyhackviii.aleo/initialize.future;

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
    cast r4 r0 r1 r2 r3 0u8 0u64 0u64 0u64 0u64 0u64 0u64 0u64 into r5 as Pool;
    async create_pool r4 r5 into r6;
    output r5 as Pool.private;
    output r6 as predictionprivacyhackviii.aleo/create_pool.future;

finalize create_pool:
    input r0 as field.public;
    input r1 as Pool.public;
    set 0u64 into total_predictions[r0];
    set r1 into pools[r0];
    get.or_use pools_id__len__[false] 0u32 into r2;
    add r2 1u32 into r3;
    set r3 into pools_id__len__[false];
    set r0 into pools_id__[r2];

function lock_pool:
    input r0 as field.public;
    assert.eq self.caller aleo1jl3q3uywtdzlr8dln65xjc2mr7vwa2pm9fsenq49zsgsz5a8pqzs0j7cj5;
    async lock_pool r0 into r1;
    output r1 as predictionprivacyhackviii.aleo/lock_pool.future;

finalize lock_pool:
    input r0 as field.public;
    get pools[r0] into r1;
    cast r1.id r1.title r1.description r1.options r1.deadline 1u8 r1.winning_option r1.total_staked r1.option_a_stakes r1.option_b_stakes r1.total_no_of_stakes r1.total_no_of_stakes_option_a r1.total_no_of_stakes_option_b into r2 as Pool;
    set r2 into pools[r0];

function resolve_pool:
    input r0 as field.public;
    input r1 as u64.public;
    assert.eq self.caller aleo1jl3q3uywtdzlr8dln65xjc2mr7vwa2pm9fsenq49zsgsz5a8pqzs0j7cj5;
    async resolve_pool r0 r1 into r2;
    output r2 as predictionprivacyhackviii.aleo/resolve_pool.future;

finalize resolve_pool:
    input r0 as field.public;
    input r1 as u64.public;
    get pools[r0] into r2;
    cast r2.id r2.title r2.description r2.options r2.deadline 2u8 r1 r2.total_staked r2.option_a_stakes r2.option_b_stakes r2.total_no_of_stakes r2.total_no_of_stakes_option_a r2.total_no_of_stakes_option_b into r3 as Pool;
    set r3 into pools[r0];

function predict:
    input r0 as field.private;
    input r1 as u64.private;
    input r2 as u64.private;
    input r3 as u64.private;
    input r4 as credits.record;
    is.eq r1 1u64 into r5;
    is.eq r1 2u64 into r6;
    or r5 r6 into r7;
    assert.eq r7 true;
    assert.neq r2 0u64;
    hash.bhp256 r3 into r8 as field;
    cast self.caller r8 r0 r1 r2 false into r9 as Prediction.record;
    ternary r5 r2 0u64 into r10;
    ternary r5 0u64 r2 into r11;
    sub r4.microcredits r2 into r12;
    cast r4.owner r12 into r13 as credits.record;
    cast aleo1jl3q3uywtdzlr8dln65xjc2mr7vwa2pm9fsenq49zsgsz5a8pqzs0j7cj5 r4.microcredits into r14 as credits.record;
    async predict r0 r8 r2 r1 r10 r11 into r15;
    output r9 as Prediction.record;
    output r13 as credits.record;
    output r14 as credits.record;
    output r15 as predictionprivacyhackviii.aleo/predict.future;

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
    cast r7.id r7.title r7.description r7.options r7.deadline r7.status r7.winning_option r10 r11 r12 r7.total_no_of_stakes r7.total_no_of_stakes_option_a r7.total_no_of_stakes_option_b into r13 as Pool;
    set r13 into pools[r0];
    get total_predictions[r0] into r14;
    add r14 1u64 into r15;
    set r15 into total_predictions[r0];

function check_prediction:
    input r0 as Prediction.record;
    async check_prediction r0.pool_id r0.option into r1;
    output r1 as predictionprivacyhackviii.aleo/check_prediction.future;

finalize check_prediction:
    input r0 as field.public;
    input r1 as u64.public;
    contains pools[r0] into r2;
    assert.eq r2 true;
    get pools[r0] into r3;
    assert.eq r3.status 2u8;
    assert.eq r3.winning_option r1;

closure calculate_winnings:
    input r0 as u64;
    input r1 as u64;
    input r2 as u64;
    is.eq r2 0u64 into r3;
    mul r0 r1 into r4;
    div r4 r2 into r5;
    ternary r3 0u64 r5 into r6;
    output r6 as u64;

function collect_winnings:
    input r0 as u64.private;
    input r1 as u64.private;
    input r2 as u64.private;
    input r3 as u64.private;
    input r4 as credits.record;
    input r5 as Prediction.record;
    assert.eq r0 r5.option;
    assert.eq r5.claimed false;
    is.eq r0 1u64 into r6;
    gt r2 0u64 into r7;
    not r6 into r8;
    or r7 r8 into r9;
    assert.eq r9 true;
    call calculate_winnings r5.amount r1 r2 into r10;
    is.eq r0 2u64 into r11;
    gt r3 0u64 into r12;
    and r8 r11 into r13;
    not r13 into r14;
    or r12 r14 into r15;
    assert.eq r15 true;
    add r2 r3 into r16;
    call calculate_winnings r5.amount r1 r16 into r17;
    ternary r11 r17 0u64 into r18;
    ternary r6 r10 r18 into r19;
    cast r5.owner r5.id r5.pool_id r5.option r19 true into r20 as Prediction.record;
    sub r4.microcredits r19 into r21;
    cast r4.owner r21 into r22 as credits.record;
    cast r5.owner r19 into r23 as credits.record;
    async collect_winnings r5.pool_id r5.id r5.amount r0 r1 r2 r3 into r24;
    output r20 as Prediction.record;
    output r22 as credits.record;
    output r23 as credits.record;
    output r24 as predictionprivacyhackviii.aleo/collect_winnings.future;

finalize collect_winnings:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as u64.public;
    input r3 as u64.public;
    input r4 as u64.public;
    input r5 as u64.public;
    input r6 as u64.public;
    contains pools[r0] into r7;
    assert.eq r7 true;
    get pools[r0] into r8;
    assert.eq r8.status 2u8;
    assert.eq r8.winning_option r3;
    assert.eq r8.total_staked r4;
    assert.eq r8.option_a_stakes r5;
    assert.eq r8.option_b_stakes r6;

constructor:
    assert.eq program_owner aleo1jl3q3uywtdzlr8dln65xjc2mr7vwa2pm9fsenq49zsgsz5a8pqzs0j7cj5;
