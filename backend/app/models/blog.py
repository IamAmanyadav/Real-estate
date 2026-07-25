"""BlogPost and BlogTag ORM models."""

from __future__ import annotations

import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BlogPost(Base):
    __tablename__ = "blog_posts"

    slug: Mapped[str] = mapped_column(String(300), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    cover_image: Mapped[str] = mapped_column(String(500), nullable=False)
    author_name: Mapped[str] = mapped_column(String(100), nullable=False)
    author_avatar: Mapped[str] = mapped_column(String(500), nullable=False)
    author_role: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    read_time: Mapped[int] = mapped_column(Integer, nullable=False)
    published_at: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Relationships
    tags: Mapped[list["BlogTag"]] = relationship(
        "BlogTag", back_populates="blog_post", cascade="all, delete-orphan",
        lazy="selectin",
    )


class BlogTag(Base):
    __tablename__ = "blog_tags"

    blog_post_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    tag: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    blog_post: Mapped["BlogPost"] = relationship("BlogPost", back_populates="tags")
