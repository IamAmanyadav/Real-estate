"""Admin inquiries service — business logic for inquiry management (extended)."""

from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin import inquiries_repository as repo
from app.admin.inquiries_schemas import (
    AdminInquiryResponse,
    InquiryStatusUpdate,
    PaginatedInquiries,
    TrackingStatusUpdate,
)
from app.models.property import Property
from app.sse.manager import sse_manager


def _to_response(inq, property_title: str | None = None) -> AdminInquiryResponse:
    return AdminInquiryResponse(
        id=str(inq.id),
        name=inq.name,
        email=inq.email,
        phone=inq.phone,
        message=inq.message,
        propertyId=str(inq.property_id) if inq.property_id else None,
        propertyTitle=property_title,
        inquiryStatus=inq.inquiry_status,
        adminNotes=inq.admin_notes,
        createdAt=inq.created_at.isoformat() if inq.created_at else "",
        updatedAt=inq.updated_at.isoformat() if inq.updated_at else "",
        # Buyer tracking fields
        inquiryType=inq.inquiry_type or "inquiry",
        buyerId=str(inq.buyer_id) if inq.buyer_id else None,
        buyerName=inq.buyer.full_name if inq.buyer else None,
        trackingStatus=inq.tracking_status or "submitted",
        adminResponse=inq.admin_response,
    )


async def list_inquiries(
    db: AsyncSession,
    *,
    inquiry_status: str | None = None,
    inquiry_type: str | None = None,
    tracking_status: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> PaginatedInquiries:
    items_data, total = await repo.list_inquiries(
        db,
        inquiry_status=inquiry_status,
        inquiry_type=inquiry_type,
        tracking_status=tracking_status,
        search=search,
        page=page,
        limit=limit,
    )
    items = [
        _to_response(d["inquiry"], d["property_title"])
        for d in items_data
    ]
    total_pages = max(1, (total + limit - 1) // limit)
    return PaginatedInquiries(
        items=items, total=total, page=page, limit=limit, totalPages=total_pages,
    )


async def get_inquiry(db: AsyncSession, inquiry_id: str) -> AdminInquiryResponse:
    try:
        uid = uuid.UUID(inquiry_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    inq = await repo.get_inquiry_by_id(db, uid)
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    prop_title = None
    if inq.property_id:
        from sqlalchemy import select
        result = await db.execute(
            select(Property.title).where(Property.id == inq.property_id)
        )
        prop_title = result.scalar()

    return _to_response(inq, prop_title)


async def update_inquiry_status(
    db: AsyncSession, inquiry_id: str, data: InquiryStatusUpdate,
) -> AdminInquiryResponse:
    try:
        uid = uuid.UUID(inquiry_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    updates = {"inquiry_status": data.inquiry_status.value}
    if data.admin_notes is not None:
        updates["admin_notes"] = data.admin_notes
        # Sync admin_response so buyers see it in their dashboard
        if data.inquiry_status.value == "responded":
            updates["admin_response"] = data.admin_notes

    inq = await repo.update_inquiry(db, uid, updates)
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return _to_response(inq)


async def update_tracking_status(
    db: AsyncSession, inquiry_id: str, data: TrackingStatusUpdate,
) -> AdminInquiryResponse:
    """Update tracking status and send SSE notification to buyer."""
    try:
        uid = uuid.UUID(inquiry_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    updates: dict = {"tracking_status": data.tracking_status.value}
    if data.admin_response is not None:
        updates["admin_response"] = data.admin_response

    inq = await repo.update_inquiry(db, uid, updates)
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    # Push SSE event to buyer if they have an account
    if inq.buyer_id:
        await sse_manager.broadcast(
            str(inq.buyer_id),
            {
                "type": "inquiry_status_changed",
                "inquiryId": str(uid),
                "trackingStatus": data.tracking_status.value,
                "adminResponse": data.admin_response,
            },
        )

    return _to_response(inq)


async def delete_inquiry(db: AsyncSession, inquiry_id: str) -> bool:
    try:
        uid = uuid.UUID(inquiry_id)
    except ValueError:
        return False
    return await repo.delete_inquiry(db, uid)
