# Prediction Pool Smart Contract Documentation

## Overview
This smart contract implements a decentralized prediction market system where users can stake tokens on binary outcomes (Yes/No or Option A/Option B). An admin creates and manages prediction pools, while users can place predictions and claim winnings if their prediction is correct.

---

## Data Structures

### Pool
Represents a prediction pool/market.

**Fields:**
- `id` (field): Unique identifier for the pool
- `title` (field): Pool title
- `description` (field): Pool description
- `options` ([field; 2]): Array of two options (e.g., ["Yes", "No"])
- `deadline` (u64): Unix timestamp when predictions close
- `status` (u8): Current pool status
  - `0` = Open (accepting predictions)
  - `1` = Closed (locked, no new predictions)
  - `2` = Resolved (winner determined)
- `winning_option` (u64): Index of winning option
  - `0` = Unresolved
  - `1` = Option 1 wins
  - `2` = Option 2 wins
- `total_staked` (u64): Total amount staked across all options
- `option_a_stakes` (u64): Total stakes for option A
- `option_b_stakes` (u64): Total stakes for option B
- `total_no_of_stakes` (u64): Total number of stakes placed (NEW)
- `total_no_of_stakes_option_a` (u64): Total number of stakes for option A (NEW)
- `total_no_of_stakes_option_b` (u64): Total number of stakes for option B (NEW)

### Prediction (Record)
Represents a user's prediction. This is a private record owned by the user.

**Fields:**
- `id` (field): Unique prediction identifier
- `owner` (address): Address of the user who made the prediction
- `pool_id` (field): ID of the pool this prediction belongs to
- `option` (u64): Selected option (1 or 2)
- `amount` (u64): Amount staked
- `claimed` (bool): Whether winnings have been claimed

### Winnings (Record)
Represents user winnings (currently defined but not fully implemented).

**Fields:**
- `prediction_id` (field): Associated prediction ID
- `owner` (address): Winner's address
- `amount_won` (u64): Amount won

---

## Storage Mappings

- `pools`: Maps pool ID to Pool details
- `total_predictions`: Maps pool ID to total number of predictions made
- `user_predictions`: Storage array for tracking user predictions (NEW - changed from mapping to storage)

---

## Constants

- `ADMIN`: Address with administrative privileges
  - Value: `aleo1jl3q3uywtdzlr8dln65xjc2mr7vwa2pm9fsenq49zsgsz5a8pqzs0j7cj5`

---

## Functions

### `initialize()`
**Access:** Public  
**Purpose:** Initializes the contract (placeholder function)  
**Parameters:** None  
**Returns:** Future for async finalization  
**Notes:** Currently just creates a default object, not critical for operation

---

### `create_pool(title, description, options, deadline)`
**Access:** Admin only  
**Purpose:** Creates a new prediction pool

**Parameters:**
- `title` (field): Pool title
- `description` (field): Pool description
- `options` ([field; 2]): Two prediction options
- `deadline` (u64): Unix timestamp for prediction deadline

**Returns:** 
- Pool struct
- Future for async finalization

**Process:**
1. Generates pool ID by hashing the title
2. Verifies caller is admin
3. Creates new Pool with status = 0 (open)
4. Initializes stake tracking fields (total_staked, option_a_stakes, option_b_stakes, and NEW stake count fields)
5. Stores pool in mapping
6. Initializes total_predictions count to 0

**Validation:**
- Only admin can call this function

---

### `lock_pool(id)`
**Access:** Admin only  
**Purpose:** Locks a pool to prevent further predictions

**Parameters:**
- `id` (field): Pool ID to lock

**Returns:** Future for async finalization

**Process:**
1. Verifies caller is admin
2. Retrieves pool from storage
3. Sets pool status to 1 (closed)
4. Updates pool in storage

**Validation:**
- Only admin can call this function
- Pool must exist

---

### `resolve_pool(id, winning_option)`
**Access:** Admin only  
**Purpose:** Resolves a pool by declaring the winning option

**Parameters:**
- `id` (field): Pool ID to resolve
- `winning_option` (u64): Winning option (1 or 2)

**Returns:** Future for async finalization

**Process:**
1. Verifies caller is admin
2. Retrieves pool from storage
3. Sets winning_option field
4. Sets pool status to 2 (resolved)
5. Updates pool in storage

**Validation:**
- Only admin can call this function
- Pool must exist

---

### `predict(pool_id, option, amount, random_number)`
**Access:** Public  
**Purpose:** Allows users to make a prediction by staking tokens

**Parameters:**
- `pool_id` (field): ID of the pool to predict on
- `option` (u64): Chosen option (1 or 2)
- `amount` (u64): Amount to stake
- `random_number` (u64): Random number for generating unique prediction ID

**Returns:**
- Prediction record (private to user)
- Future for async finalization

**Process:**
1. Validates option is 1 or 2
2. Validates amount is greater than 0
3. Generates unique prediction ID from random_number
4. Creates Prediction record
5. Updates pool's total_staked and option stakes
6. Increments total_predictions count
7. Updates stake count tracking for both total and option-specific stakes (NEW)

**Validation:**
- Pool must exist
- Pool status must be 0 (open)
- Current time must be before deadline
- Option must be 1 or 2
- Amount must be greater than 0

---

### `check_prediction(prediction)`
**Access:** Public  
**Purpose:** Verifies if a prediction was correct (will fail if prediction lost)

**Parameters:**
- `prediction` (Prediction): The prediction record to check

**Returns:** Future for async finalization

**Process:**
1. Retrieves pool from storage
2. Verifies pool is resolved (status = 2)
3. Asserts user's option matches winning_option

**Validation:**
- Pool must exist
- Pool must be resolved (status = 2)
- User's option must match winning option (function fails otherwise)

**Notes:** This function will fail/revert if the prediction was incorrect

---

### `collect_winnings(winning_option, total_staked, option_a_stakes, option_b_stakes, prediction)`
**Access:** Public  
**Purpose:** Allows winners to claim their winnings

**Parameters:**
- `winning_option` (u64): The winning option
- `total_staked` (u64): Total amount staked in the pool
- `option_a_stakes` (u64): Total stakes on option A
- `option_b_stakes` (u64): Total stakes on option B
- `prediction` (Prediction): User's prediction record

**Returns:**
- Updated Prediction record with winnings amount and claimed = true
- Future for async finalization

**Process:**
1. Verifies prediction option matches winning_option
2. Verifies winnings haven't been claimed already
3. Calculates winnings using proportional distribution formula
4. Creates updated prediction record with claimed = true
5. Validates pool is resolved and winning option matches

**Validation:**
- User's option must match winning option
- Prediction must not be already claimed
- Pool must exist
- Pool must be resolved (status = 2)
- Winning option must match pool's winning_option

**Winnings Calculation:**
```
winnings = (amount_staked * total_staked) / total_winning_stakes
```

**Notes:** Actual token transfer logic is not implemented (marked as TODO)

---

### `calculate_winnings(amount_staked, total_staked, total_winning_stakes)` (Helper)
**Access:** Private helper function  
**Purpose:** Calculates winnings based on proportional distribution

**Parameters:**
- `amount_staked` (u64): Amount the user staked
- `total_staked` (u64): Total amount staked in the pool
- `total_winning_stakes` (u64): Total stakes on the winning side

**Returns:** Winnings amount (u64)

**Formula:**
```
(user_stake × total_pool_stake) ÷ total_winning_stakes
```

**Edge Cases:**
- Returns 0 if total_winning_stakes is 0

---

## Workflow Example

### For Admin:
1. `create_pool()` - Create a new prediction market
2. Wait for users to make predictions
3. `lock_pool()` - Lock the pool when ready (optional)
4. `resolve_pool()` - Declare the winning option after event occurs

### For Users:
1. `predict()` - Make a prediction by staking tokens
2. Wait for pool resolution
3. `check_prediction()` - Verify if prediction was correct
4. `collect_winnings()` - Claim winnings if prediction was correct

---

## Known Limitations & TODOs

1. **Token Transfer:** Actual token transfer logic for staking and winnings distribution is not implemented
2. **No Refund Mechanism:** No way to cancel predictions or get refunds
3. **No Fee Mechanism:** No platform fee or admin commission structure

---

## Recent Changes (v2.0)

### New Features Added:
1. **Enhanced Stake Tracking:** Added three new fields to Pool struct to track the number of stakes:
   - `total_no_of_stakes`: Total number of individual stake transactions
   - `total_no_of_stakes_option_a`: Count of stakes placed on option A
   - `total_no_of_stakes_option_b`: Count of stakes placed on option B
   
2. **Improved Storage Architecture:**
   - Changed `user_predictions` from a mapping to a storage array for better flexibility
   - Removed `pool_predictions` mapping that was only storing single prediction IDs

3. **Enhanced `collect_winnings` Function:**
   - Now includes validation for pool stakes data (total_staked, option_a_stakes, option_b_stakes)
   - Ensures data consistency between prediction and pool records
   - Better safeguards against invalid winnings claims

### Benefits:
- More detailed pool analytics and user statistics
- Better ability to track prediction participation rates
- Enhanced data validation in winnings collection
- More flexible user prediction tracking

---

## Recent Changes (v3.0)

### New features added:
1. **Add aleo credits collections and distributions**
  - Whne someone places a prediction the credits is being collected and is given to the admin
  - When someone claims winnings the admins credits is being reduced and a new credit is created for the user with this new amount 

## Integration Notes for Frontend

### Required User Inputs:
- **Creating Pools:** title, description, two options, deadline timestamp
- **Making Predictions:** pool_id, option choice (1 or 2), stake amount, random number for ID generation
- **Claiming Winnings:** prediction record, pool statistics (winning_option, stakes data)

### Important UX Considerations:
- Display pool deadline prominently
- Show current pool status (Open/Closed/Resolved)
- Display current stakes on each option
- Calculate and display potential winnings before user commits
- Store prediction records securely (they're private to the user)
- `check_prediction()` will fail if user lost - handle this gracefully in UI