"""Pydantic schemas for admin user management."""

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class UserRole(str, Enum):
    admin = "admin"
    seller = "seller"
    buyer = "buyer"


class UserStatus(str, Enum):
    active = "active"
    suspended = "suspended"
    pending_verification = "pending_verification"
    rejected = "rejected"


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    fullName: str
    phone: str | None = None
    avatar: str | None = None
    role: str
    status: str
    isVerified: bool
    verifiedAt: str | None = None
    bio: str | None = None
    createdAt: str
    updatedAt: str
    propertyCount: int = 0


class AdminUserCreate(BaseModel):
    email: str = Field(..., min_length=5, max_length=200)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=150, alias="fullName")
    phone: str | None = None
    role: UserRole = UserRole.buyer
    bio: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class AdminUserUpdate(BaseModel):
    full_name: str | None = Field(None, alias="fullName")
    phone: str | None = None
    bio: str | None = None
    avatar: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class AdminUserStatusUpdate(BaseModel):
    status: UserStatus
    reason: str | None = None


class PaginatedUsers(BaseModel):
    items: list[AdminUserResponse]
    total: int
    page: int
    limit: int
    totalPages: int
