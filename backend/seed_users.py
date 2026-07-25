"""Quick script to seed admin users if they don't exist."""
import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User

try:
    import bcrypt
    def _hash(pw):
        return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
except ImportError:
    def _hash(pw):
        return pw

USERS = [
    {"email": "admin@luxeestates.com", "password": "Admin@123", "full_name": "Admin User", "phone": "+1 (555) 000-0001", "role": "admin", "status": "active", "is_verified": True, "bio": "Platform administrator"},
    {"email": "seller1@luxeestates.com", "password": "Seller@123", "full_name": "John Rivera", "phone": "+1 (555) 200-0001", "role": "seller", "status": "active", "is_verified": True, "bio": "Experienced property seller"},
    {"email": "seller2@luxeestates.com", "password": "Seller@123", "full_name": "Maria Santos", "phone": "+1 (555) 200-0002", "role": "seller", "status": "pending_verification", "is_verified": False, "bio": "New seller"},
    {"email": "buyer1@luxeestates.com", "password": "Buyer@123", "full_name": "Emily Johnson", "phone": "+1 (555) 300-0001", "role": "buyer", "status": "active", "is_verified": True, "bio": "Looking for a family home"},
    {"email": "buyer2@luxeestates.com", "password": "Buyer@123", "full_name": "Robert Kim", "phone": "+1 (555) 300-0002", "role": "buyer", "status": "active", "is_verified": True, "bio": "First-time home buyer"},
]

async def seed_users():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).limit(1))
        if result.scalars().first():
            print("Users already seeded.")
            return
        from datetime import datetime, timezone
        for u in USERS:
            pw = u.pop("password")
            user = User(**u, password_hash=_hash(pw))
            if u.get("is_verified"):
                user.verified_at = datetime.now(timezone.utc)
            session.add(user)
        await session.flush()
        await session.commit()
        print(f"Seeded {len(USERS)} users. Admin: admin@luxeestates.com / Admin@123")

if __name__ == "__main__":
    asyncio.run(seed_users())
