"""Buyer inquiries repository — SQLAlchemy CRUD with buyer ownership checks."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.inquiry import Inquiry
from app.models.property import Property


async def create_buyer_inquiry(
    db: AsyncSession,
    *,
    buyer_id: uuid.UUID,
    buyer_name: str,
    buyer_email: str,
    property_id: uuid.UUID,
    message: str,
    inquiry_type: str,
    phone: str | None = None,
) -> Inquiry:
    """Create a buyer-linked inquiry."""
    inquiry = Inquiry(
        name=buyer_name,
        email=buyer_email,
        phone=phone,
        message=message,
        property_id=property_id,
        inquiry_type=inquiry_type,
        buyer_id=buyer_id,
        tracking_status="submitted",
        inquiry_status="new",
    )
    db.add(inquiry)
    await db.flush()
    await db.refresh(inquiry, attribute_names=["property", "buyer"])
    return inquiry


async def list_buyer_inquiries(
    db: AsyncSession,
    buyer_id: uuid.UUID,
    *,
    inquiry_type: str | None = None,
    tracking_status: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Inquiry], int]:
    """Return (inquiries, total) for a specific buyer."""
    query = (
        select(Inquiry)
        .options(selectinload(Inquiry.property).selectinload(Property.images))
        .where(Inquiry.buyer_id == buyer_id)
    )

    if inquiry_type:
        query = query.where(Inquiry.inquiry_type == inquiry_type)
    if tracking_status:
        query = query.where(Inquiry.tracking_status == tracking_status)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    query = query.order_by(Inquiry.created_at.desc())
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    return list(result.scalars().unique().all()), total


async def get_buyer_inquiry(
    db: AsyncSession, inquiry_id: uuid.UUID, buyer_id: uuid.UUID,
) -> Inquiry | None:
    """Get a single inquiry owned by the buyer."""
    query = (
        select(Inquiry)
        .options(selectinload(Inquiry.property).selectinload(Property.images))
        .where(Inquiry.id == inquiry_id, Inquiry.buyer_id == buyer_id)
    )
    result = await db.execute(query)
    return result.scalars().first()


async def get_buyer_stats(
    db: AsyncSession, buyer_id: uuid.UUID,
) -> dict[str, int]:
    """Get dashboard statistics for a buyer."""
    total = (await db.execute(
        select(func.count(Inquiry.id)).where(Inquiry.buyer_id == buyer_id)
    )).scalar_one()

    purchase_requests = (await db.execute(
        select(func.count(Inquiry.id)).where(
            Inquiry.buyer_id == buyer_id,
            Inquiry.inquiry_type == "purchase_request",
        )
    )).scalar_one()

    pending = (await db.execute(
        select(func.count(Inquiry.id)).where(
            Inquiry.buyer_id == buyer_id,
            Inquiry.tracking_status.in_(["submitted", "under_review"]),
        )
    )).scalar_one()

    responded = (await db.execute(
        select(func.count(Inquiry.id)).where(
            Inquiry.buyer_id == buyer_id,
            Inquiry.inquiry_status.in_(["responded", "closed"]),
        )
    )).scalar_one()

    return {
        "total": total,
        "purchase_requests": purchase_requests,
        "pending": pending,
        "responded": responded,
    }
