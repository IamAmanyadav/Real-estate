"""One-time script to remove properties created by legacy dummy accounts.

The old seed data included demo seller/buyer accounts that have since been
removed. This script deletes any properties that were created by those
now-defunct accounts, ensuring only genuine user-submitted properties remain.

Run: python cleanup_dummy_properties.py
"""

import asyncio

from sqlalchemy import select, delete, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.property import Property


# The old demo accounts that were replaced by the new auth flow
LEGACY_DEMO_EMAILS = [
    "admin@luxeestates.com",
    "seller@luxeestates.com",
    "seller2@luxeestates.com",
    "buyer@luxeestates.com",
    "buyer2@luxeestates.com",
]


async def cleanup():
    async with AsyncSessionLocal() as session:
        # Step 1: Find legacy demo user IDs
        result = await session.execute(
            select(User.id, User.email).where(User.email.in_(LEGACY_DEMO_EMAILS))
        )
        legacy_users = result.all()

        if not legacy_users:
            print("No legacy demo accounts found in the database. Nothing to clean up.")
            return

        legacy_ids = [u.id for u in legacy_users]
        legacy_emails = [u.email for u in legacy_users]
        print(f"Found {len(legacy_users)} legacy demo account(s): {legacy_emails}")

        # Step 2: Count properties belonging to legacy users
        prop_result = await session.execute(
            select(Property).where(Property.seller_id.in_(legacy_ids))
        )
        props = prop_result.scalars().all()
        print(f"Found {len(props)} properties from legacy accounts.")

        if props:
            for p in props:
                print(f"  - Deleting: [{p.id}] {p.title}")

            # Step 3: Delete those properties
            await session.execute(
                delete(Property).where(Property.seller_id.in_(legacy_ids))
            )
            print(f"Deleted {len(props)} dummy properties.")

        # Step 4: Delete the legacy user accounts themselves
        await session.execute(
            delete(User).where(User.id.in_(legacy_ids))
        )
        print(f"Deleted {len(legacy_users)} legacy user account(s).")

        await session.commit()
        print("Cleanup complete!")


if __name__ == "__main__":
    asyncio.run(cleanup())
