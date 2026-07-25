"""Admin user management API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_admin
from app.db.deps import get_db
from app.admin import users_service as service
from app.admin.users_schemas import (
    AdminUserCreate,
    AdminUserResponse,
    AdminUserStatusUpdate,
    AdminUserUpdate,
    PaginatedUsers,
)
from app.models.user import User

router = APIRouter()


@router.get("", response_model=PaginatedUsers)
async def list_users(
    role: str | None = Query(None),
    status: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return await service.list_users(
        db, role=role, status=status, search=search, page=page, limit=limit,
    )


@router.get("/{user_id}", response_model=AdminUserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return await service.get_user(db, user_id)


@router.post("", response_model=AdminUserResponse, status_code=201)
async def create_user(
    data: AdminUserCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return await service.create_user(db, data)


@router.put("/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: str,
    data: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return await service.update_user(db, user_id, data)


@router.patch("/{user_id}/status", response_model=AdminUserResponse)
async def update_user_status(
    user_id: str,
    data: AdminUserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return await service.update_user_status(db, user_id, data)


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    if not await service.delete_user(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")
