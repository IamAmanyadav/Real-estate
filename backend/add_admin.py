"""One-time script to insert the admin account into an existing database.

Admin credentials are read from environment variables (ADMIN_EMAIL, ADMIN_PASSWORD).
Set these in your .env file before running.
"""

import asyncio
import os

from sqlalchemy import text

from app.db.session import AsyncSessionLocal


async def add_admin():
    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        print("Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file.")
        return

    async with AsyncSessionLocal() as session:
        # Check if admin already exists
        result = await session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": admin_email},
        )
        if result.fetchone():
            print("Admin account already exists — skipping.")
            return

        # Hash the password
        import bcrypt
        pw_hash = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode()

        await session.execute(
            text(
                "INSERT INTO users (id, email, password_hash, full_name, phone, role, status, is_verified, bio, created_at, updated_at) "
                "VALUES (gen_random_uuid(), :email, :pw_hash, 'Admin', '+1 (555) 000-0001', 'admin', 'active', true, 'Platform administrator', now(), now())"
            ),
            {"email": admin_email, "pw_hash": pw_hash},
        )

        await session.commit()
        print("Admin account created successfully.")


if __name__ == "__main__":
    asyncio.run(add_admin())
