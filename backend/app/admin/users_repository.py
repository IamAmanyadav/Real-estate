"""Admin users repository — SQLAlchemy CRUD operations."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.property import Property


async def list_users(
    db: AsyncSession,
    *,
    role: str | None = None,
    status: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[User], int]:
    """Return (users, total) with filtering and pagination."""
    query = select(User)

    if role:
        query = query.where(User.role == role)
    if status:
        query = query.where(User.status == status)
    if search:
        term = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(User.full_name).like(term),
                func.lower(User.email).like(term),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    query = query.order_by(User.created_at.desc())
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    return list(result.scalars().unique().all()), total


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()


async def create_user(db: AsyncSession, **kwargs: Any) -> User:
    user = User(**kwargs)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def update_user(
    db: AsyncSession, user_id: uuid.UUID, updates: dict[str, Any],
) -> User | None:
    user = await get_user_by_id(db, user_id)
    if not user:
        return None
    for key, value in updates.items():
        setattr(user, key, value)
    await db.flush()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user_id: uuid.UUID) -> bool:
    user = await get_user_by_id(db, user_id)
    if not user:
        return False
    await db.delete(user)
    await db.flush()
    return True


async def count_user_properties(db: AsyncSession, user_id: uuid.UUID) -> int:
    query = select(func.count()).where(Property.seller_id == user_id)
    return (await db.execute(query)).scalar_one()
