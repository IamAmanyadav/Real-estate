"""One-time script to insert the new admin account into an existing database."""

import asyncio

from sqlalchemy import text

from app.db.session import AsyncSessionLocal


async def add_admin():
    async with AsyncSessionLocal() as session:
        # Check if new admin already exists
        result = await session.execute(
            text("SELECT id FROM users WHERE email = 'adminreal@gmail.com'")
        )
        if result.fetchone():
            print("Admin account already exists — skipping.")
            return

        # Hash the password
        import bcrypt
        pw_hash = bcrypt.hashpw("jaswant123".encode(), bcrypt.gensalt()).decode()

        await session.execute(
            text(
                "INSERT INTO users (id, email, password_hash, full_name, phone, role, status, is_verified, bio, created_at, updated_at) "
                "VALUES (gen_random_uuid(), 'adminreal@gmail.com', :pw_hash, 'Admin', '+1 (555) 000-0001', 'admin', 'active', true, 'Platform administrator', now(), now())"
            ),
            {"pw_hash": pw_hash},
        )

        await session.commit()
        print("Admin account created: adminreal@gmail.com / jaswant123")


if __name__ == "__main__":
    asyncio.run(add_admin())
