"""Blog service layer — DB-backed."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.blog import repository
from app.blog.schemas import BlogAuthor, BlogPostResponse
from app.models.blog import BlogPost


def _to_response(post: BlogPost) -> BlogPostResponse:
    """Convert an ORM BlogPost to the camelCase API response."""
    return BlogPostResponse(
        id=str(post.id),
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        content=post.content,
        coverImage=post.cover_image,
        author=BlogAuthor(
            name=post.author_name,
            avatar=post.author_avatar,
            role=post.author_role,
        ),
        category=post.category,
        tags=[t.tag for t in post.tags],
        publishedAt=post.published_at,
        readTime=post.read_time,
    )


async def list_posts(db: AsyncSession) -> list[BlogPostResponse]:
    posts = await repository.list_blog_posts(db)
    return [_to_response(p) for p in posts]


async def get_post_by_slug(db: AsyncSession, slug: str) -> BlogPostResponse | None:
    post = await repository.get_blog_post_by_slug(db, slug)
    return _to_response(post) if post else None
