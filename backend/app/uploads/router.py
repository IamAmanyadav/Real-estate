"""Image upload endpoint for property listings.

Accepts multipart file uploads, validates file types and sizes,
saves to the local uploads directory, and returns serving URLs.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel

from app.auth.deps import get_current_seller
from app.models.user import User

router = APIRouter()

# ── Configuration ────────────────────────────────────────────────────────────

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "properties"
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
    """Upload one or more property images.

    - Accepts JPEG, PNG, WebP, GIF
    - Max 5 MB per file, max 10 files per request
    - Returns a list of URLs that can be used as property image URLs
    """
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_FILES} files per upload.",
        )

    # Ensure upload directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

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

        # Save with UUID filename to avoid collisions
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = UPLOAD_DIR / unique_name
        file_path.write_bytes(content)

        # Build the serving URL (relative to the static mount)
        url = f"/uploads/properties/{unique_name}"
        urls.append(url)

    return UploadResponse(urls=urls, count=len(urls))
