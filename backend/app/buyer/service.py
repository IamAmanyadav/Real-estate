"""Buyer inquiries service — business logic for buyer inquiry management."""

from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.buyer import repository as repo
from app.buyer.schemas import (
    BuyerDashboardStats,
    BuyerInquiryCreate,
    BuyerInquiryResponse,
    PaginatedBuyerInquiries,
)
from app.models.inquiry import Inquiry
from app.models.property import Property
from app.models.user import User


def _to_response(inq: Inquiry) -> BuyerInquiryResponse:
    """Convert an Inquiry ORM model to the buyer API response."""
    prop = inq.property
    prop_image = None
    prop_price = None
    if prop:
        prop_image = prop.images[0].url if prop.images else None
        prop_price = float(prop.price)

    return BuyerInquiryResponse(
        id=str(inq.id),
        propertyId=str(inq.property_id) if inq.property_id else None,
        propertyTitle=prop.title if prop else None,
        propertyImage=prop_image,
        propertyPrice=prop_price,
        message=inq.message,
        inquiryType=inq.inquiry_type,
        trackingStatus=inq.tracking_status,
        adminResponse=inq.admin_response,
        inquiryStatus=inq.inquiry_status,
        createdAt=inq.created_at.isoformat() if inq.created_at else "",
        updatedAt=inq.updated_at.isoformat() if inq.updated_at else "",
    )


async def create_inquiry(
    db: AsyncSession, data: BuyerInquiryCreate, buyer: User,
) -> BuyerInquiryResponse:
    """Create a new buyer inquiry or purchase request."""
    try:
        prop_id = uuid.UUID(data.propertyId)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid property ID")

    # Check property exists and is approved/published
    result = await db.execute(
        select(Property).where(Property.id == prop_id)
    )
    prop = result.scalars().first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.verification_status not in ("approved", "published"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Property is not available for inquiries",
        )

    # Check buyer isn't inquiring about their own property
    if prop.seller_id and prop.seller_id == buyer.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit inquiry on your own property",
        )

    inq = await repo.create_buyer_inquiry(
        db,
        buyer_id=buyer.id,
        buyer_name=buyer.full_name,
        buyer_email=buyer.email,
        property_id=prop_id,
        message=data.message,
        inquiry_type=data.inquiryType.value,
        phone=data.phone,
    )
    return _to_response(inq)


async def list_inquiries(
    db: AsyncSession,
    buyer_id: uuid.UUID,
    *,
    inquiry_type: str | None = None,
    tracking_status: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> PaginatedBuyerInquiries:
    items, total = await repo.list_buyer_inquiries(
        db, buyer_id,
        inquiry_type=inquiry_type,
        tracking_status=tracking_status,
        page=page, limit=limit,
    )
    total_pages = max(1, (total + limit - 1) // limit)
    return PaginatedBuyerInquiries(
        items=[_to_response(i) for i in items],
        total=total,
        page=page,
        limit=limit,
        totalPages=total_pages,
    )


async def get_inquiry(
    db: AsyncSession, inquiry_id: str, buyer_id: uuid.UUID,
) -> BuyerInquiryResponse:
    try:
        uid = uuid.UUID(inquiry_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    inq = await repo.get_buyer_inquiry(db, uid, buyer_id)
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return _to_response(inq)


async def get_dashboard_stats(
    db: AsyncSession, buyer_id: uuid.UUID,
) -> BuyerDashboardStats:
    stats = await repo.get_buyer_stats(db, buyer_id)
    return BuyerDashboardStats(
        totalInquiries=stats["total"],
        purchaseRequests=stats["purchase_requests"],
        pendingResponses=stats["pending"],
        respondedInquiries=stats["responded"],
    )
