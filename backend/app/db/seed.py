"""Seed script — populates the database with agents, blog posts, and users.

Run: python -m app.db.seed

Note: No dummy properties are seeded. Properties are created exclusively
by verified sellers through the seller dashboard and approved by admins.
"""

import asyncio
import os

from sqlalchemy import select

from app.db.session import AsyncSessionLocal, engine
from app.models.agent import Agent
from app.models.blog import BlogPost, BlogTag
from app.models.user import User

try:
    import bcrypt
    def _hash(pw: str) -> str:
        return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
except ImportError:
    def _hash(pw: str) -> str:
        return pw  # fallback if bcrypt not installed


USERS = [
    {"email": os.environ.get("ADMIN_EMAIL", "admin@luxeestates.com"), "password": os.environ.get("ADMIN_PASSWORD", "Admin@123"), "full_name": "Admin", "phone": "+1 (555) 000-0001", "role": "admin", "status": "active", "is_verified": True, "bio": "Platform administrator"},
]


# ── Agent seed data ──────────────────────────────────────────────────────────

AGENTS = [
    {"name": "Alexandra Wright", "email": "alex@luxeestates.com", "phone": "+1 (555) 101-2001", "title": "Senior Agent", "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face"},
    {"name": "Marcus Chen", "email": "marcus@luxeestates.com", "phone": "+1 (555) 101-2002", "title": "Head of Sales", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"},
    {"name": "Sophie Anderson", "email": "sophie@luxeestates.com", "phone": "+1 (555) 101-2003", "title": "Lead Agent", "avatar": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"},
    {"name": "David Okafor", "email": "david@luxeestates.com", "phone": "+1 (555) 101-2004", "title": "Property Analyst", "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"},
]



# ── Blog seed data ───────────────────────────────────────────────────────────

BLOG_POSTS_DATA = []


async def seed():
    """Populate DB with seed data. Idempotent — skips if agents already exist."""
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        result = await session.execute(select(Agent).limit(1))
        if result.scalars().first():
            print("Database already seeded — skipping.")
            return

        # Create agents
        agents = []
        for a in AGENTS:
            agent = Agent(**a)
            session.add(agent)
            agents.append(agent)
        await session.flush()
        print(f"Seeded {len(agents)} agents.")

        # Note: Properties are NOT seeded. They are created by sellers
        # and approved by admins through the verification workflow.

        # Create blog posts
        for b in BLOG_POSTS_DATA:
            tags = b.pop("tags")
            post = BlogPost(**b)
            for t in tags:
                post.tags.append(BlogTag(tag=t))
            session.add(post)
        await session.flush()
        print(f"Seeded {len(BLOG_POSTS_DATA)} blog posts.")

        # Create users (admin + sample sellers/buyers)
        from datetime import datetime as dt2, timezone as tz2
        for u in USERS:
            pw = u.pop("password")
            user = User(**u, password_hash=_hash(pw))
            if u.get("is_verified"):
                user.verified_at = dt2.now(tz2.utc)
            session.add(user)
        await session.flush()
        print(f"Seeded {len(USERS)} users.")

        await session.commit()
        print("Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
