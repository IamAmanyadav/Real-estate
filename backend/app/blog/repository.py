"""Blog repository — SQLAlchemy CRUD operations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.blog import BlogPost


async def list_blog_posts(db: AsyncSession) -> list[BlogPost]:
    """Return all blog posts with tags, ordered by published_at desc."""
    query = (
        select(BlogPost)
        .options(selectinload(BlogPost.tags))
        .order_by(BlogPost.published_at.desc())
    )
    result = await db.execute(query)
    return list(result.scalars().unique().all())


async def get_blog_post_by_slug(db: AsyncSession, slug: str) -> BlogPost | None:
    """Get a single blog post by slug."""
    query = (
        select(BlogPost)
        .options(selectinload(BlogPost.tags))
        .where(BlogPost.slug == slug)
    )
    result = await db.execute(query)
    return result.scalars().first()
