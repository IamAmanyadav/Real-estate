"""Auth API endpoints — login, registration, and current user info."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.auth.schemas import (
    AuthUserResponse,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
)
from app.auth.service import authenticate_user, create_access_token, hash_password
from app.db.deps import get_db
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
