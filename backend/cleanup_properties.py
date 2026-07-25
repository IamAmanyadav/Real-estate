"""One-time script to remove all seeded/dummy properties from the database.

Preserves users, agents, blog posts, and any other non-property data.
Run: python cleanup_properties.py
"""

import asyncio

from sqlalchemy import text

from app.db.session import AsyncSessionLocal


async def cleanup():
    async with AsyncSessionLocal() as session:
        # Delete in correct order to respect foreign keys
        tables = [
            "property_status_history",
            "property_documents",
            "property_images",
            "property_features",
            "properties",
        ]
        for table in tables:
            result = await session.execute(text(f"DELETE FROM {table}"))
            print(f"Deleted {result.rowcount} rows from {table}")

        await session.commit()
        print("\nAll property data has been removed. Users, agents, and blog data are preserved.")


if __name__ == "__main__":
    asyncio.run(cleanup())
