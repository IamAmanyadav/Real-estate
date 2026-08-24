"""Database migration script for the bidding system.
Adds auction columns to properties and creates the bids table.
"""

import asyncio
from sqlalchemy import text
from app.db.session import engine
from app.models.bid import Bid  # noqa: F401
from app.models.property import Property  # noqa: F401
from app.db.base import Base


async def migrate():
    async with engine.begin() as conn:
        # Create auction_status_enum
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE auction_status_enum AS ENUM (
                    'draft', 'active', 'ended', 'accepted', 'rejected', 'offline_completed', 'cancelled'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))

        # Create bid_status_enum
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE bid_status_enum AS ENUM (
                    'active', 'outbid', 'winning', 'accepted', 'rejected'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))

        # Add auction columns individually
        statements = [
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_auction BOOLEAN NOT NULL DEFAULT FALSE;",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS reserve_price NUMERIC(12, 2);",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS auction_start_date TIMESTAMPTZ;",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS auction_end_date TIMESTAMPTZ;",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS min_bid_increment NUMERIC(12, 2) NOT NULL DEFAULT 1000.00;",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS current_highest_bid NUMERIC(12, 2);",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS highest_bidder_id UUID REFERENCES users(id) ON DELETE SET NULL;",
            "ALTER TABLE properties ADD COLUMN IF NOT EXISTS auction_status auction_status_enum;",
            "CREATE INDEX IF NOT EXISTS ix_properties_is_auction ON properties (is_auction);",
            "CREATE INDEX IF NOT EXISTS ix_properties_auction_end_date ON properties (auction_end_date);",
            "CREATE INDEX IF NOT EXISTS ix_properties_current_highest_bid ON properties (current_highest_bid);",
            "CREATE INDEX IF NOT EXISTS ix_properties_highest_bidder_id ON properties (highest_bidder_id);",
            "CREATE INDEX IF NOT EXISTS ix_properties_auction_status ON properties (auction_status);"
        ]

        for stmt in statements:
            await conn.execute(text(stmt))

        # Create bids table
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[Base.metadata.tables["bids"]],
        )

    print("Successfully applied bidding migration (columns, enums, indexes, and bids table).")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())
