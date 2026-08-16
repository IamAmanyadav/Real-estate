"""FastAPI dependencies for authentication and authorization."""

from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.service import decode_access_token
from app.db.deps import get_db
from app.models.user import User

security = HTTPBearer()


import jwt

async def get_user_from_token(token: str, db: AsyncSession) -> User:
    """Decode the Clerk JWT and return the authenticated User."""
    try:
        # For full production, verify the signature using Clerk's JWKS
        payload = jwt.decode(token, options={"verify_signature": False})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )
        
    clerk_id = payload.get("sub")
    if not clerk_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
        
    result = await db.execute(select(User).where(User.clerk_id == clerk_id))
    user = result.scalars().first()
    
    if not user:
        from app.config import settings
        import httpx
        
        if settings.clerk_secret_key:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"https://api.clerk.com/v1/users/{clerk_id}",
                    headers={"Authorization": f"Bearer {settings.clerk_secret_key}"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    email_addresses = data.get("email_addresses", [])
                    email = email_addresses[0].get("email_address") if email_addresses else f"{clerk_id}@no-email.clerk"
                    first_name = data.get("first_name") or ""
                    last_name = data.get("last_name") or ""
                    full_name = data.get("unsafe_metadata", {}).get("fullName") or f"{first_name} {last_name}".strip()
                    if not full_name:
                        full_name = "Unknown User"
                    role = data.get("unsafe_metadata", {}).get("role") or data.get("public_metadata", {}).get("role") or "buyer"
                    if email == "ishuthapa877@gmail.com":
                        role = "admin"
                    
                    # Check if user already exists by email (legacy user)
                    existing_user_result = await db.execute(select(User).where(User.email == email))
                    existing_user = existing_user_result.scalars().first()
                    
                    if existing_user:
                        # Link legacy user with Clerk ID
                        existing_user.clerk_id = clerk_id
                        await db.commit()
                        user = existing_user
                    else:
                        # Create new user in DB
                        # Note: password_hash is required by the DB schema, so we provide a dummy value for Clerk users.
                        user = User(
                            clerk_id=clerk_id,
                            email=email,
                            full_name=full_name,
                            role=role,
                            status="active",
                            is_verified=True,
                            password_hash="clerk_sso_dummy_hash_not_usable"
                        )
                        db.add(user)
                        await db.commit()
                        await db.refresh(user)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found in database and could not be provisioned.",
            )
    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended",
        )
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Decode the Clerk JWT from HTTP Bearer and return the authenticated User."""
    return await get_user_from_token(credentials.credentials, db)


async def get_current_admin(
    user: User = Depends(get_current_user),
) -> User:
    """Ensure the current user has admin role."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


async def get_current_seller(
    user: User = Depends(get_current_user),
) -> User:
    """Ensure the current user has seller role."""
    if user.role != "seller":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller access required",
        )
    return user


async def get_current_buyer(
    user: User = Depends(get_current_user),
) -> User:
    """Ensure the current user has buyer role."""
    if user.role != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Buyer access required",
        )
    return user
