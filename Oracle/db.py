import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "oracle.db")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS markets (
            pool_id TEXT PRIMARY KEY,
            deadline INTEGER NOT NULL,
            threshold REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            metric_type TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def add_market(pool_id, deadline, threshold, metric_type="eth_staking_rate"):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR REPLACE INTO markets (pool_id, deadline, threshold, metric_type)
        VALUES (?, ?, ?, ?)
    """,
        (pool_id, deadline, threshold, metric_type),
    )
    conn.commit()
    conn.close()


def get_pending_markets():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT pool_id, deadline, threshold, metric_type FROM markets WHERE status = 'pending'"
    )
    markets = cursor.fetchall()
    conn.close()
    return markets


def mark_resolved(pool_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE markets SET status = 'resolved' WHERE pool_id = ?", (pool_id,)
    )
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized.")
