"""Auth API endpoints — login, registration, password reset, and current user info."""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.auth.email_service import send_password_reset_email
from app.auth.schemas import (
    AuthUserResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
)
from app.auth.service import authenticate_user, create_access_token, hash_password
from app.db.deps import get_db
from app.models.password_reset import PasswordResetToken
from app.models.user import User

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate an admin/user and return a JWT."""
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended",
        )
    token = create_access_token(str(user.id), user.role)
    return LoginResponse(
        access_token=token,
        user=AuthUserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            avatar=user.avatar,
        ),
    )


@router.post("/register", response_model=LoginResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new buyer or seller account and return a JWT."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Create the user
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=data.role.value,
        status="active",
        is_verified=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    # Return JWT so user is logged in immediately
    token = create_access_token(str(user.id), user.role)
    return LoginResponse(
        access_token=token,
        user=AuthUserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            avatar=user.avatar,
        ),
    )


@router.get("/me", response_model=AuthUserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return AuthUserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        avatar=user.avatar,
    )


# ── Password Reset ──────────────────────────────────────────────────────────


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Send a password reset email if the user exists.

    Always returns a success message to prevent email enumeration attacks.
    """
    # Look up user (only buyers and sellers can reset — not admin)
    result = await db.execute(
        select(User).where(User.email == data.email, User.role.in_(["buyer", "seller"]))
    )
    user = result.scalars().first()

    if user:
        # Invalidate any existing unused tokens for this user
        await db.execute(
            update(PasswordResetToken)
            .where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used == False,  # noqa: E712
            )
            .values(used=True)
        )

        # Generate a secure token
        token = secrets.token_urlsafe(48)

        # Store in DB with 30-minute expiry
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
        db.add(reset_token)
        await db.flush()

        # Send the email
        send_password_reset_email(
            to_email=user.email,
            reset_token=token,
            user_name=user.full_name,
        )

    # Always return the same message (prevents email enumeration)
    return ForgotPasswordResponse(
        message="If an account with that email exists, a password reset link has been sent."
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset a user's password using a valid token."""
    # Find the token
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token == data.token,
            PasswordResetToken.used == False,  # noqa: E712
        )
    )
    token_record = result.scalars().first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset link. Please request a new one.",
        )

    # Check if token has expired
    if datetime.now(timezone.utc) > token_record.expires_at:
        token_record.used = True
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link has expired. Please request a new one.",
        )

    # Find the user
    user_result = await db.execute(
        select(User).where(User.id == token_record.user_id)
    )
    user = user_result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found.",
        )

    # Update password
    user.password_hash = hash_password(data.new_password)

    # Mark token as used
    token_record.used = True

    return ResetPasswordResponse(message="Your password has been reset successfully.")
