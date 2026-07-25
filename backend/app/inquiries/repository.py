"""Inquiries repository — SQLAlchemy CRUD operations."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inquiry import Inquiry


async def create_inquiry(
    db: AsyncSession,
    *,
    name: str,
    email: str,
    phone: str | None,
    message: str,
    property_id: uuid.UUID | None,
    buyer_id: uuid.UUID | None = None,
) -> Inquiry:
    """Insert a new inquiry row and return it."""
    inquiry = Inquiry(
        name=name,
        email=email,
        phone=phone,
        message=message,
        property_id=property_id,
        buyer_id=buyer_id,
    )
    db.add(inquiry)
    await db.flush()
    await db.refresh(inquiry)
    return inquiry
