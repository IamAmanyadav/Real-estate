"""Authentication schemas for login, registration, and token management."""

from enum import Enum

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=200)
    password: str = Field(..., min_length=6, max_length=100)


class RegisterRole(str, Enum):
    buyer = "buyer"
    seller = "seller"


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=200)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=150)
    role: RegisterRole = RegisterRole.buyer


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "AuthUserResponse"


class AuthUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    avatar: str | None = None


class TokenPayload(BaseModel):
    sub: str  # user id
    role: str
    exp: int

