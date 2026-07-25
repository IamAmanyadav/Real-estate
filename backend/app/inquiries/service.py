"""Inquiry service layer — DB-backed."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.inquiries import repository
from app.inquiries.schemas import InquiryCreate, InquiryResponse


async def create_inquiry(
    db: AsyncSession, data: InquiryCreate, token: str | None = None,
) -> InquiryResponse:
    """Create an inquiry and return the standard acknowledgement response.

    If a valid JWT token is provided, link the inquiry to the buyer.
    """
    property_id: uuid.UUID | None = None
    if data.propertyId:
        try:
            property_id = uuid.UUID(data.propertyId)
        except ValueError:
            pass

    # Try to extract buyer_id from token if provided
    buyer_id: uuid.UUID | None = None
    if token:
        try:
            from app.auth.service import decode_access_token
            payload = decode_access_token(token)
            if payload and payload.get("sub"):
                buyer_id = uuid.UUID(payload["sub"])
        except (ValueError, KeyError):
            pass  # Invalid token — proceed without linking

    inquiry = await repository.create_inquiry(
        db,
        name=data.name,
        email=data.email,
        phone=data.phone,
        message=data.message,
        property_id=property_id,
        buyer_id=buyer_id,
    )

    return InquiryResponse(
        id=str(inquiry.id),
        message="Your inquiry has been received. We will contact you within 24 hours.",
        createdAt=inquiry.created_at.isoformat() if inquiry.created_at else "",
    )
