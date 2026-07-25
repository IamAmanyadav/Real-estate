"""Blog Pydantic schemas."""

from pydantic import BaseModel, ConfigDict


class BlogAuthor(BaseModel):
    name: str
    avatar: str
    role: str


class BlogPostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    title: str
    excerpt: str
    content: str
    coverImage: str
    author: BlogAuthor
    category: str
    tags: list[str]
    publishedAt: str
    readTime: int
