"""Admin inquiries repository — SQLAlchemy CRUD operations (extended)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.inquiry import Inquiry
from app.models.property import Property


async def list_inquiries(
    db: AsyncSession,
    *,
    inquiry_status: str | None = None,
    inquiry_type: str | None = None,
    tracking_status: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[dict], int]:
    """Return (inquiries_with_property, total) with filtering and pagination."""
    query = select(Inquiry).options(
        selectinload(Inquiry.buyer),
    )

    if inquiry_status:
        query = query.where(Inquiry.inquiry_status == inquiry_status)
    if inquiry_type:
        query = query.where(Inquiry.inquiry_type == inquiry_type)
    if tracking_status:
        query = query.where(Inquiry.tracking_status == tracking_status)
    if search:
        term = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(Inquiry.name).like(term),
                func.lower(Inquiry.email).like(term),
                func.lower(Inquiry.message).like(term),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    query = query.order_by(Inquiry.created_at.desc())
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    inquiries = list(result.scalars().unique().all())

    # Fetch property titles for each inquiry
    items = []
    for inq in inquiries:
        prop_title = None
        if inq.property_id:
            prop_result = await db.execute(
                select(Property.title).where(Property.id == inq.property_id)
            )
            prop_title = prop_result.scalar()
        items.append({"inquiry": inq, "property_title": prop_title})

    return items, total


async def get_inquiry_by_id(db: AsyncSession, inquiry_id: uuid.UUID) -> Inquiry | None:
    result = await db.execute(
        select(Inquiry)
        .options(selectinload(Inquiry.buyer))
        .where(Inquiry.id == inquiry_id)
    )
    return result.scalars().first()


async def update_inquiry(
    db: AsyncSession, inquiry_id: uuid.UUID, updates: dict[str, Any],
) -> Inquiry | None:
    inq = await get_inquiry_by_id(db, inquiry_id)
    if not inq:
        return None
    for key, value in updates.items():
        setattr(inq, key, value)
    await db.flush()
    await db.refresh(inq)
    return inq


async def delete_inquiry(db: AsyncSession, inquiry_id: uuid.UUID) -> bool:
    inq = await get_inquiry_by_id(db, inquiry_id)
    if not inq:
        return False
    await db.delete(inq)
    await db.flush()
    return True


async def count_inquiries_by_status(db: AsyncSession) -> dict[str, int]:
    query = (
        select(Inquiry.inquiry_status, func.count())
        .group_by(Inquiry.inquiry_status)
    )
    result = await db.execute(query)
    return {row[0]: row[1] for row in result.all()}
