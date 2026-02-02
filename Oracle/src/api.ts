import express from "express";
import * as db from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Get all markets
app.get("/markets", async (req, res) => {
    try {
        const markets = await db.getAllMarkets();
        res.json(markets);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get pending markets
app.get("/markets/pending", async (req, res) => {
    try {
        const markets = await db.getPendingMarkets();
        res.json(markets);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get locked markets
app.get("/markets/locked", async (req, res) => {
    try {
        const markets = await db.getLockedMarkets();
        res.json(markets);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get market by ID
app.get("/markets/:id", async (req, res) => {
    try {
        const market = await db.getMarketById(req.params.id);
        if (!market) {
            return res.status(404).json({ error: "Market not found" });
        }
        res.json(market);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new market
app.post("/markets", async (req, res) => {
    try {
        const {
            title,
            description,
            option_a_label,
            option_b_label,
            metric_type,
            threshold,
            deadline
        } = req.body;

        // Validate required fields
        if (!title || !deadline || !threshold) {
            return res.status(400).json({
                error: "Missing required fields: title, deadline, threshold"
            });
        }

        // Generate market ID from title hash (similar to Leo program)
        const marketId = generateMarketId(title);

        await db.addMarket(
            marketId,
            title,
            parseInt(deadline),
            parseFloat(threshold),
            metric_type || 'generic',
            description || '',
            option_a_label || 'YES',
            option_b_label || 'NO'
        );

        res.status(201).json({
            success: true,
            market_id: marketId,
            message: "Market created successfully"
        });
    } catch (error: any) {
        console.error("Error creating market:", error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to generate market ID
function generateMarketId(title: string): string {
    // Simple hash-like ID generation (similar to BHP256::hash_to_field in Leo)
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        const char = title.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    // Make positive and add timestamp for uniqueness
    const uniqueId = Math.abs(hash) + Date.now();
    return `${uniqueId}field`;
}

// Manually resolve a market (for generic/manual markets)
app.post("/markets/:id/resolve", async (req, res) => {
    try {
        const { id } = req.params;
        const { winning_option } = req.body;

        if (!winning_option || (winning_option !== 1 && winning_option !== 2)) {
            return res.status(400).json({
                error: "winning_option must be 1 or 2"
            });
        }

        const market = await db.getMarketById(id);
        if (!market) {
            return res.status(404).json({ error: "Market not found" });
        }

        if (market.status !== 'locked') {
            return res.status(400).json({
                error: `Market must be locked to resolve. Current status: ${market.status}`
            });
        }

        await db.markResolved(id);

        res.json({
            success: true,
            market_id: id,
            winning_option,
            message: `Market resolved with option ${winning_option}`
        });
    } catch (error: any) {
        console.error("Error resolving market:", error);
        res.status(500).json({ error: error.message });
    }
});

// Lock a market manually
app.post("/markets/:id/lock", async (req, res) => {
    try {
        const { id } = req.params;

        const market = await db.getMarketById(id);
        if (!market) {
            return res.status(404).json({ error: "Market not found" });
        }

        if (market.status !== 'pending') {
            return res.status(400).json({
                error: `Market must be pending to lock. Current status: ${market.status}`
            });
        }

        await db.markLocked(id);

        res.json({
            success: true,
            market_id: id,
            message: "Market locked successfully"
        });
    } catch (error: any) {
        console.error("Error locking market:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get available metric types
app.get("/metrics", (req, res) => {
    res.json({
        metrics: [
            { name: "eth_price", description: "Ethereum price in USD" },
            { name: "btc_price", description: "Bitcoin price in USD" },
            { name: "eth_gas_price", description: "Ethereum gas price in gwei" },
            { name: "btc_dominance", description: "BTC #1 by market cap (1=yes, 0=no)" },
            { name: "eth_staking_rate", description: "Ethereum staking APR %" },
            { name: "fear_greed", description: "Crypto Fear & Greed Index (0-100)" },
            { name: "stablecoin_peg", description: "Stablecoin peg status" },
            { name: "generic", description: "Manual resolution by admin" },
        ]
    });
});

app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    db.initDb();
});
