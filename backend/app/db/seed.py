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

BLOG_POSTS_DATA = [
    {"slug": "first-time-homebuyer-guide-2026", "title": "The Ultimate First-Time Homebuyer Guide for 2026", "excerpt": "Everything you need to know about purchasing your first home.", "content": "Buying your first home is one of the most exciting milestones in life...", "cover_image": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=500&fit=crop", "author_name": "Alexandra Wright", "author_avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face", "author_role": "CEO", "category": "Buying Guide", "read_time": 8, "published_at": "2026-05-15T10:00:00Z", "tags": ["first-time buyer", "mortgage", "home buying", "tips"]},
    {"slug": "real-estate-market-trends-summer-2026", "title": "Real Estate Market Trends to Watch This Summer", "excerpt": "Key trends shaping the housing market.", "content": "The summer 2026 real estate market is showing fascinating dynamics...", "cover_image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop", "author_name": "Marcus Chen", "author_avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", "author_role": "Head of Sales", "category": "Market Analysis", "read_time": 6, "published_at": "2026-06-01T10:00:00Z", "tags": ["market trends", "interest rates", "housing market", "investment"]},
    {"slug": "staging-tips-sell-faster", "title": "10 Home Staging Tips to Sell Your Property Faster", "excerpt": "Professional staging secrets.", "content": "Home staging can make the difference between a property that sits on the market and one that sells in days...", "cover_image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop", "author_name": "Sophie Anderson", "author_avatar": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face", "author_role": "Lead Agent", "category": "Selling Tips", "read_time": 7, "published_at": "2026-04-20T10:00:00Z", "tags": ["staging", "selling", "home improvement", "tips"]},
    {"slug": "smart-home-features-add-value", "title": "Smart Home Features That Actually Add Property Value", "excerpt": "Learn which upgrades provide the best ROI.", "content": "Smart home technology is no longer a novelty...", "cover_image": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop", "author_name": "David Okafor", "author_avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", "author_role": "Property Analyst", "category": "Home Improvement", "read_time": 5, "published_at": "2026-03-10T10:00:00Z", "tags": ["smart home", "technology", "property value", "renovation"]},
    {"slug": "investment-property-mistakes", "title": "5 Common Mistakes Real Estate Investors Make", "excerpt": "Avoid these costly pitfalls.", "content": "Real estate investing can build tremendous wealth, but it's not without risks...", "cover_image": "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&h=500&fit=crop", "author_name": "Marcus Chen", "author_avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", "author_role": "Head of Sales", "category": "Investment", "read_time": 6, "published_at": "2026-02-28T10:00:00Z", "tags": ["investment", "mistakes", "real estate investing", "tips"]},
    {"slug": "sustainable-living-green-homes", "title": "The Rise of Sustainable Living: Green Homes in 2026", "excerpt": "How eco-friendly features are transforming real estate.", "content": "Sustainability has moved from a niche concern to a mainstream priority...", "cover_image": "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=500&fit=crop", "author_name": "Sophie Anderson", "author_avatar": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face", "author_role": "Lead Agent", "category": "Lifestyle", "read_time": 5, "published_at": "2026-01-15T10:00:00Z", "tags": ["sustainability", "green homes", "eco-friendly", "lifestyle"]},
]


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
