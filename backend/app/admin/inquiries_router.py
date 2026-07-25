"""Admin inquiry management API endpoints — extended with tracking."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_admin
from app.db.deps import get_db
from app.admin import inquiries_service as service
from app.admin.inquiries_schemas import (
    AdminInquiryResponse,
    InquiryStatusUpdate,
    PaginatedInquiries,
    TrackingStatusUpdate,
)
from app.models.user import User

router = APIRouter()


@router.get("", response_model=PaginatedInquiries)
async def list_inquiries(
    inquiry_status: str | None = Query(None, alias="inquiryStatus"),
    inquiry_type: str | None = Query(None, alias="inquiryType"),
    tracking_status: str | None = Query(None, alias="trackingStatus"),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return await service.list_inquiries(
        db,
        inquiry_status=inquiry_status,
        inquiry_type=inquiry_type,
        tracking_status=tracking_status,
        search=search,
        page=page,
        limit=limit,
    )


@router.get("/{inquiry_id}", response_model=AdminInquiryResponse)
async def get_inquiry(
    inquiry_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return await service.get_inquiry(db, inquiry_id)


@router.patch("/{inquiry_id}", response_model=AdminInquiryResponse)
async def update_inquiry_status(
    inquiry_id: str,
    data: InquiryStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return await service.update_inquiry_status(db, inquiry_id, data)


@router.patch("/{inquiry_id}/tracking", response_model=AdminInquiryResponse)
async def update_tracking_status(
    inquiry_id: str,
    data: TrackingStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Update tracking status and optionally send admin response to buyer."""
    return await service.update_tracking_status(db, inquiry_id, data)


@router.delete("/{inquiry_id}", status_code=204)
async def delete_inquiry(
    inquiry_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    if not await service.delete_inquiry(db, inquiry_id):
        raise HTTPException(status_code=404, detail="Inquiry not found")
