"""Authentication service — password hashing and JWT management."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User


# ── Password Hashing ────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a plain-text password with bcrypt."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── JWT ──────────────────────────────────────────────────────────────────────

def create_access_token(user_id: str, role: str) -> str:
    """Create a signed JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes,
    )
    payload = {
        "sub": user_id,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_access_token(token: str) -> dict | None:
    """Decode and validate a JWT access token. Returns payload or None."""
    try:
        return jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except JWTError:
        return None


# ── User lookup ──────────────────────────────────────────────────────────────

async def authenticate_user(
    db: AsyncSession, email: str, password: str,
) -> User | None:
    """Validate credentials and return the User, or None."""
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalars().first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user
