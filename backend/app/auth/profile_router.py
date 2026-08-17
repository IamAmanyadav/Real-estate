"""User profile API endpoints — allows any authenticated user to view/update their own profile."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.db.deps import get_db
from app.models.user import User

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    fullName: str
    phone: str | None = None
    avatar: str | None = None
    role: str
    status: str
    isVerified: bool
    bio: str | None = None
    createdAt: str
    updatedAt: str


class ProfileUpdate(BaseModel):
    fullName: str | None = Field(None, min_length=2, max_length=150)
    phone: str | None = None
    bio: str | None = None
    avatar: str | None = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _to_response(user: User) -> ProfileResponse:
    return ProfileResponse(
        id=str(user.id),
        email=user.email,
        fullName=user.full_name,
        phone=user.phone,
        avatar=user.avatar,
        role=user.role,
        status=user.status,
        isVerified=user.is_verified,
        bio=user.bio,
        createdAt=user.created_at.isoformat() if user.created_at else "",
        updatedAt=user.updated_at.isoformat() if user.updated_at else "",
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user: User = Depends(get_current_user)):
    """Return the full profile of the currently authenticated user."""
    return _to_response(user)


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update the authenticated user's profile fields."""
    if data.fullName is not None:
        user.full_name = data.fullName
    if data.phone is not None:
        user.phone = data.phone
    if data.bio is not None:
        user.bio = data.bio
    if data.avatar is not None:
        user.avatar = data.avatar

    user.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(user)
    return _to_response(user)
