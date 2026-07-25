"""One-time script to create the conversations and messages tables.

Run: python create_messages_table.py
"""

import asyncio

from sqlalchemy import text

from app.db.session import engine
from app.models.message import Conversation, Message  # noqa: F401
from app.db.base import Base


async def create_tables():
    async with engine.begin() as conn:
        # Create only the new tables (conversations, messages)
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[
                Base.metadata.tables["conversations"],
                Base.metadata.tables["messages"],
            ],
        )
    print("Created tables: conversations, messages")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_tables())
