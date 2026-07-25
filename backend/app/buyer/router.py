"""Buyer inquiry management API endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_buyer
from app.db.deps import get_db
from app.models.user import User
from app.buyer import service
from app.buyer.schemas import (
    BuyerDashboardStats,
    BuyerInquiryCreate,
    BuyerInquiryResponse,
    PaginatedBuyerInquiries,
)

router = APIRouter()


@router.get("/inquiries", response_model=PaginatedBuyerInquiries)
async def list_inquiries(
    inquiry_type: str | None = Query(None, alias="inquiryType"),
    tracking_status: str | None = Query(None, alias="trackingStatus"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    buyer: User = Depends(get_current_buyer),
):
    """List the authenticated buyer's inquiries."""
    return await service.list_inquiries(
        db, buyer.id,
        inquiry_type=inquiry_type,
        tracking_status=tracking_status,
        page=page, limit=limit,
    )


@router.get("/dashboard-stats", response_model=BuyerDashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    buyer: User = Depends(get_current_buyer),
):
    """Get dashboard statistics for the buyer."""
    return await service.get_dashboard_stats(db, buyer.id)


@router.get("/inquiries/{inquiry_id}", response_model=BuyerInquiryResponse)
async def get_inquiry(
    inquiry_id: str,
    db: AsyncSession = Depends(get_db),
    buyer: User = Depends(get_current_buyer),
):
    """Get a single inquiry owned by the buyer."""
    return await service.get_inquiry(db, inquiry_id, buyer.id)


@router.post("/inquiries", response_model=BuyerInquiryResponse, status_code=201)
async def create_inquiry(
    data: BuyerInquiryCreate,
    db: AsyncSession = Depends(get_db),
    buyer: User = Depends(get_current_buyer),
):
    """Submit a new inquiry or purchase request."""
    return await service.create_inquiry(db, data, buyer)
