"""Blog API endpoints — async DB-backed."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.deps import get_db
from app.blog.schemas import BlogPostResponse
from app.blog import service

router = APIRouter()


@router.get("/posts", response_model=list[BlogPostResponse])
async def list_posts(db: AsyncSession = Depends(get_db)):
    return await service.list_posts(db)


@router.get("/posts/{slug}", response_model=BlogPostResponse)
async def get_post(slug: str, db: AsyncSession = Depends(get_db)):
    post = await service.get_post_by_slug(db, slug)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post
