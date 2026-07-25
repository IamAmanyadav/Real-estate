"""Admin users service — business logic for user management."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin import users_repository as repo
from app.admin.users_schemas import (
    AdminUserCreate,
    AdminUserResponse,
    AdminUserStatusUpdate,
    AdminUserUpdate,
    PaginatedUsers,
)
from app.auth.service import hash_password


def _to_response(user, property_count: int = 0) -> AdminUserResponse:
    return AdminUserResponse(
        id=str(user.id),
        email=user.email,
        fullName=user.full_name,
        phone=user.phone,
        avatar=user.avatar,
        role=user.role,
        status=user.status,
        isVerified=user.is_verified,
        verifiedAt=user.verified_at.isoformat() if user.verified_at else None,
        bio=user.bio,
        createdAt=user.created_at.isoformat() if user.created_at else "",
        updatedAt=user.updated_at.isoformat() if user.updated_at else "",
        propertyCount=property_count,
    )


async def list_users(
    db: AsyncSession,
    *,
    role: str | None = None,
    status: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> PaginatedUsers:
    users, total = await repo.list_users(
        db, role=role, status=status, search=search, page=page, limit=limit,
    )
    items = []
    for u in users:
        count = await repo.count_user_properties(db, u.id)
        items.append(_to_response(u, count))

    total_pages = max(1, (total + limit - 1) // limit)
    return PaginatedUsers(
        items=items, total=total, page=page, limit=limit, totalPages=total_pages,
    )


async def get_user(db: AsyncSession, user_id: str) -> AdminUserResponse:
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="User not found")
    user = await repo.get_user_by_id(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    count = await repo.count_user_properties(db, uid)
    return _to_response(user, count)


async def create_user(db: AsyncSession, data: AdminUserCreate) -> AdminUserResponse:
    existing = await repo.get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    user = await repo.create_user(
        db,
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role=data.role.value,
        bio=data.bio,
        status="active",
        is_verified=True,
        verified_at=datetime.now(timezone.utc),
    )
    return _to_response(user)


async def update_user(
    db: AsyncSession, user_id: str, data: AdminUserUpdate,
) -> AdminUserResponse:
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="User not found")

    raw = data.model_dump(exclude_unset=True, by_alias=False)
    mapping = {"full_name": "full_name"}
    updates = {}
    for k, v in raw.items():
        updates[mapping.get(k, k)] = v

    user = await repo.update_user(db, uid, updates)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    count = await repo.count_user_properties(db, uid)
    return _to_response(user, count)


async def update_user_status(
    db: AsyncSession, user_id: str, data: AdminUserStatusUpdate,
) -> AdminUserResponse:
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="User not found")

    updates: dict = {"status": data.status.value}
    if data.status.value == "active":
        updates["is_verified"] = True
        updates["verified_at"] = datetime.now(timezone.utc)

    user = await repo.update_user(db, uid, updates)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    count = await repo.count_user_properties(db, uid)
    return _to_response(user, count)


async def delete_user(db: AsyncSession, user_id: str) -> bool:
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        return False
    return await repo.delete_user(db, uid)
