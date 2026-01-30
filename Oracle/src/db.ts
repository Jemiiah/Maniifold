import pg from "pg";
const { Pool } = pg;
import { DB_CONFIG } from "./config.js";

const pool = new Pool(DB_CONFIG);

export async function getAllMarkets(): Promise<any[]> {
    try {
        const query = `SELECT * FROM markets`;
        const { rows } = await pool.query(query);
        return rows;
    } catch (err: any) {
        console.error("❌ Error fetching all markets:", err.message);
        throw err;
    }
}

export async function initDb(): Promise<void> {
    const query = `
    CREATE TABLE IF NOT EXISTS markets (
        market_id TEXT PRIMARY KEY,
        deadline BIGINT,
        threshold DECIMAL,
        status TEXT DEFAULT 'pending',
        metric_type TEXT DEFAULT 'eth_staking_rate',
        description TEXT,
        option_a_label TEXT DEFAULT 'YES',
        option_b_label TEXT DEFAULT 'NO',
        total_staked BIGINT DEFAULT 0,
        option_a_stakes BIGINT DEFAULT 0,
        option_b_stakes BIGINT DEFAULT 0
    )
    `;
    try {
        await pool.query(query);
        console.log("📦 Database initialized successfully (PostgreSQL).");
    } catch (err: any) {
        console.error("❌ Database initialization error:", err.message);
        throw err;
    }
}

export async function addMarket(
    marketId: string,
    deadline: number,
    threshold: number,
    metricType: string = "eth_staking_rate",
    description: string = "",
    optionALabel: string = "YES",
    optionBLabel: string = "NO"
): Promise<void> {
    const query = `
    INSERT INTO markets (market_id, deadline, threshold, status, metric_type, description, option_a_label, option_b_label)
    VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)
    ON CONFLICT (market_id) DO UPDATE SET
        deadline = EXCLUDED.deadline,
        threshold = EXCLUDED.threshold,
        metric_type = EXCLUDED.metric_type,
        description = EXCLUDED.description,
        option_a_label = EXCLUDED.option_a_label,
        option_b_label = EXCLUDED.option_b_label
    `;
    try {
        await pool.query(query, [marketId, deadline, threshold, metricType, description, optionALabel, optionBLabel]);
        console.log(`📝 Market ${marketId} added to DB (Metric: ${metricType}).`);
    } catch (err: any) {
        console.error(`❌ Error adding market ${marketId}:`, err.message);
        throw err;
    }
}

export async function getPendingMarkets(): Promise<any[]> {
    try {
        const query = `SELECT market_id, deadline, threshold, metric_type FROM markets WHERE status = 'pending'`;
        const { rows } = await pool.query(query);
        return rows;
    } catch (err: any) {
        console.error("❌ Error fetching pending markets:", err.message);
        throw err;
    }
}

export async function getLockedMarkets(): Promise<any[]> {
    try {
        const query = `SELECT market_id, deadline, threshold, metric_type FROM markets WHERE status = 'locked'`;
        const { rows } = await pool.query(query);
        return rows;
    } catch (err: any) {
        console.error("❌ Error fetching locked markets:", err.message);
        throw err;
    }
}

export async function markLocked(marketId: string): Promise<void> {
    const query = `UPDATE markets SET status = 'locked' WHERE market_id = $1`;
    try {
        await pool.query(query, [marketId]);
        console.log(`🔒 Market ${marketId} marked as locked in DB.`);
    } catch (err: any) {
        console.error(`❌ Error marking market ${marketId} as locked:`, err.message);
        throw err;
    }
}

export async function markResolved(marketId: string): Promise<void> {
    const query = `UPDATE markets SET status = 'resolved' WHERE market_id = $1`;
    try {
        await pool.query(query, [marketId]);
        console.log(`✅ Market ${marketId} marked as resolved in DB.`);
    } catch (err: any) {
        console.error(`❌ Error marking market ${marketId} as resolved:`, err.message);
        throw err;
    }
}

export async function updateMarketStats(
    marketId: string,
    totalStaked: number,
    optionAStakes: number,
    optionBStakes: number
): Promise<void> {
    const query = `
    UPDATE markets 
    SET total_staked = $1, option_a_stakes = $2, option_b_stakes = $3 
    WHERE market_id = $4
    `;
    try {
        await pool.query(query, [totalStaked, optionAStakes, optionBStakes, marketId]);
        console.log(`📊 Updated on-chain stats for market ${marketId}.`);
    } catch (err: any) {
        console.error(`❌ Error updating stats for market ${marketId}:`, err.message);
        throw err;
    }
}

export async function updateMarketMetadata(
    marketId: string,
    optionALabel: string,
    optionBLabel: string
): Promise<void> {
    const query = `
    UPDATE markets 
    SET option_a_label = $1, option_b_label = $2 
    WHERE market_id = $3
    `;
    try {
        await pool.query(query, [optionALabel, optionBLabel, marketId]);
        console.log(`🏷️ Updated labels for market ${marketId}.`);
    } catch (err: any) {
        console.error(`❌ Error updating metadata for market ${marketId}:`, err.message);
        throw err;
    }
}
