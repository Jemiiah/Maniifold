// The 'prediction' program.
program predictionprivacyhack.aleo {
    // A simple token structure to represent prediction pools
    struct Pool {
     id: field,
     title: field,
     description: field, 
     options: [field; 2], // e.g., ["Yes", "No"]
     deadline: u64, // Unix timestamp when predictions close
     status: u8, // status of the pool 0 - open 1 closed 2 resolved
     winning_option: u64, // Index of winning option (0 - unresolved, 1 - option 1 wins, 2 - option 2 wins) 
     total_staked: u64, // Total amount staked across all options
     option_a_stakes: u64, // Total stakes for option A
     option_b_stakes: u64, // Total stakes for option B
    }

    struct Default {
        id: u32
    }


    // A structure to represent user predictions
    record Prediction {
        id: field,
        owner: address,
        pool_id: field,
        option: u64,
        amount: u64,
        claimed: bool,
    }


    // Save proposal info in public storage.
    mapping pools: field => Pool; // pool id => Pool details

    // Track total predictions per pool
    mapping total_predictions: field => u64; // pool id => total predictions count

    // Track user predictions todo(): implement logic to store user predictions
    mapping user_predictions: address => [field; 1]; // user address => prediction ids

    // Track predictions per pool
    mapping pool_predictions: field => [field; 1]; // pool id => prediction ids

    const ADMIN: address = aleo1jl3q3uywtdzlr8dln65xjc2mr7vwa2pm9fsenq49zsgsz5a8pqzs0j7cj5;

    @admin(address="aleo1jl3q3uywtdzlr8dln65xjc2mr7vwa2pm9fsenq49zsgsz5a8pqzs0j7cj5")
    async constructor() {}

    async transition initialize() -> Future {
        return finalize_initialize(self.caller);
    }

    async function finalize_initialize(owner: address) {
        let def: Default = Default {
            id: 1
        };
    }

    transition main() {}

    async transition create_pool(public title: field, public description: field, public options: [field; 2], public deadline: u64) -> (Pool, Future) {
      // generate new pool id
        let id: field = BHP256::hash_to_field(title);

        // Ensure the caller for pool creation is the admin.
        assert_eq(self.caller, ADMIN);
        // Return a new 'Pool' record for the auction bidder.
        let pool = Pool {
            id: id,
            title: title,
            description: description,
            options: options,
            deadline: deadline,
            status: 0u8,
            winning_option: 0u64,
            total_staked: 0u64,
            option_a_stakes: 0u64,
            option_b_stakes: 0u64,
        };

        return (pool, finalize_create_pool(id, pool));
    }

    async function finalize_create_pool(
        public id: field, public pool: Pool
    ) {
        Mapping::set(total_predictions, id, 0u64);
        Mapping::set(pools, id, pool);
        Mapping::set(pool_predictions, id, [id]); // todo(): change this to the base predictions the from the amdin
    }

    // Transition to lock a prediction pool (prevent further predictions).
    async transition lock_pool (public id: field) -> Future {
        // Ensure the caller for pool creation is the admin.
        assert_eq(self.caller, ADMIN);

        return finalize_lock_pool(id);
    }

    async function finalize_lock_pool(
        public id: field
    ) {
        let pool = Mapping::get(pools, id);
        pool.status = 1u8;
        Mapping::set(pools, id, pool);
    }

    // Transition to resolve a prediction pool (set the winning option).
    async transition resolve_pool(public id: field, public winning_option: u64) -> Future {
        // Ensure the caller for pool resolution is the admin.
        assert_eq(self.caller, ADMIN);

        return finalize_resolve_pool(id, winning_option);
    }

    async function finalize_resolve_pool(
        public id: field,
        public winning_option: u64
    ) {
        let pool = Mapping::get(pools, id);
        pool.winning_option = winning_option; // Set the winning option
        pool.status = 2u8; // Mark as resolved
        Mapping::set(pools, id, pool);
    }

    // User makes a prediction by staking tokens
    async transition predict(
        pool_id: field,
        option: u64,
        amount: u64,
        random_number: u64,
    ) -> (Prediction, Future) {
        assert(option == 1u64 || option == 2u64); // 1 - option 1, 2 - option 2
        assert_neq(amount, 0u64); // amount should be greater than 0
      
        let prediction_id = BHP256::hash_to_field(random_number); // generate prediction id

        let prediction = Prediction {
            id: prediction_id,
            owner: self.caller,
            pool_id: pool_id,
            option: option,
            amount: amount,
            claimed: false,
        };
        
        let option_a_stakes = 0u64;
        let option_b_stakes = 0u64;
        if option == 1u64 {
            option_a_stakes = amount;
        } else {
            option_b_stakes = amount;
        }

        return (prediction, finalize_predict(pool_id, prediction_id, amount, option, option_a_stakes, option_b_stakes));
    }

    async function finalize_predict(
        pool_id: field, prediction_id: field, amount: u64, option: u64, option_a_stakes: u64, option_b_stakes: u64
    ) {
        let pool_created = Mapping::contains(pools, pool_id);
        assert(pool_created); // ensure pool exists

        let pool = Mapping::get(pools, pool_id);
        assert_eq(pool.status, 0u8);  // ensure pool is open
        assert(pool.deadline > block.timestamp as u64); // ensure deadline not passed

        // Update pool stakes
        pool.total_staked += amount;
        pool.option_a_stakes += option_a_stakes;      
        pool.option_b_stakes += option_b_stakes; 

        Mapping::set(pools, pool_id, pool);
        Mapping::set(pool_predictions, pool_id, [prediction_id]); 

        let current_total = Mapping::get(total_predictions, pool_id);
        Mapping::set(total_predictions, pool_id, current_total + 1u64);
    }
}