"""Image upload endpoint for property listings.

Accepts multipart file uploads, validates file types and sizes,
saves to Cloudinary, and returns serving URLs.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel

from app.auth.deps import get_current_seller, get_current_user
from app.models.user import User

import cloudinary
import cloudinary.uploader

# Configure Cloudinary using environment variables
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

router = APIRouter()

# ── Configuration ────────────────────────────────────────────────────────────

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB per file
MAX_FILES = 10


class UploadResponse(BaseModel):
    urls: list[str]
    count: int


# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/images", response_model=UploadResponse)
async def upload_images(
    files: list[UploadFile] = File(..., description="Property image files (max 10, max 5MB each)"),
    _seller: User = Depends(get_current_seller),
):
    """Upload one or more property images to Cloudinary.

    - Accepts JPEG, PNG, WebP, GIF
    - Max 5 MB per file, max 10 files per request
    - Returns a list of Cloudinary secure URLs
    """
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_FILES} files per upload.",
        )

    urls: list[str] = []

    for file in files:
        # Validate content type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' is not a valid image.",
            )

        # Validate extension
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '{ext}' is not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
            )

        # Read and validate size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' exceeds the 5 MB limit.",
            )

        try:
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                content,
                folder="real_estate/properties",
                resource_type="image"
            )
            secure_url = upload_result.get("secure_url")
            if not secure_url:
                raise Exception("Missing secure_url from Cloudinary response")
            urls.append(secure_url)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image to cloud storage: {str(e)}"
            )

    return UploadResponse(urls=urls, count=len(urls))


class AvatarUploadResponse(BaseModel):
    url: str

@router.post("/avatar", response_model=AvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    _user: User = Depends(get_current_user),
):
    """Upload a profile avatar to Cloudinary.
    
    - Accepts JPEG, PNG, WebP, GIF
    - Max 5 MB per file
    - Returns the Cloudinary secure URL
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{file.filename}' is not a valid image.",
        )

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' is not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{file.filename}' exceeds the 5 MB limit.",
        )

    try:
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            content,
            folder="real_estate/avatars",
            resource_type="image",
            # Optional: apply some transformations for avatars
            transformation=[
                {"width": 500, "height": 500, "crop": "fill"}
            ]
        )
        secure_url = upload_result.get("secure_url")
        if not secure_url:
            raise Exception("Missing secure_url from Cloudinary response")
        return AvatarUploadResponse(url=secure_url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar to cloud storage: {str(e)}"
        )
