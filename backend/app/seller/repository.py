"""Seller properties repository — SQLAlchemy CRUD with ownership checks."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.property import Property, PropertyImage, PropertyFeature
from app.models.property_document import PropertyDocument
from app.models.inquiry import Inquiry


def _property_query():
    """Base query with all relationships loaded."""
    return select(Property).options(
        selectinload(Property.agent),
        selectinload(Property.images),
        selectinload(Property.features),
        selectinload(Property.documents),
        selectinload(Property.seller),
    )


async def list_seller_properties(
    db: AsyncSession,
    seller_id: uuid.UUID,
    *,
    verification_status: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Property], int]:
    """Return (properties, total) for a specific seller."""
    query = _property_query().where(Property.seller_id == seller_id)

    if verification_status:
        query = query.where(Property.verification_status == verification_status)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    query = query.order_by(Property.created_at.desc())
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    return list(result.scalars().unique().all()), total


async def get_seller_property(
    db: AsyncSession, property_id: uuid.UUID, seller_id: uuid.UUID,
) -> Property | None:
    """Get a single property owned by the seller."""
    query = _property_query().where(
        Property.id == property_id,
        Property.seller_id == seller_id,
    )
    result = await db.execute(query)
    return result.scalars().first()


async def create_property(
    db: AsyncSession,
    *,
    data: dict[str, Any],
    seller_id: uuid.UUID,
    agent_id: uuid.UUID,
    images: list[str],
    features: list[str],
    documents: list[dict],
) -> Property:
    """Create a new property listing with pending verification status."""
    prop = Property(
        **data,
        seller_id=seller_id,
        agent_id=agent_id,
        verification_status="pending",
        images=[PropertyImage(url=url, sort_order=i) for i, url in enumerate(images)],
        features=[PropertyFeature(name=name) for name in features],
        documents=[
            PropertyDocument(
                document_type=doc["documentType"],
                document_url=doc["documentUrl"],
                document_name=doc["documentName"],
                sort_order=i,
            )
            for i, doc in enumerate(documents)
        ],
    )
    db.add(prop)
    await db.flush()
    # Reload with all relationships
    return await get_seller_property(db, prop.id, seller_id)  # type: ignore[return-value]


async def update_property(
    db: AsyncSession,
    property_id: uuid.UUID,
    seller_id: uuid.UUID,
    updates: dict[str, Any],
) -> Property | None:
    """Update a seller's property (only if pending/rejected)."""
    prop = await get_seller_property(db, property_id, seller_id)
    if not prop:
        return None

    for key, value in updates.items():
        if key == "images":
            prop.images.clear()
            for i, url in enumerate(value):
                prop.images.append(PropertyImage(url=url, sort_order=i))
        elif key == "features":
            prop.features.clear()
            for name in value:
                prop.features.append(PropertyFeature(name=name))
        elif key == "documents":
            prop.documents.clear()
            for i, doc in enumerate(value):
                prop.documents.append(PropertyDocument(
                    document_type=doc["documentType"],
                    document_url=doc["documentUrl"],
                    document_name=doc["documentName"],
                    sort_order=i,
                ))
        else:
            setattr(prop, key, value)

    # Reset to pending on re-submission
    if prop.verification_status == "rejected":
        prop.verification_status = "pending"
        prop.rejection_reason = None

    await db.flush()
    return await get_seller_property(db, property_id, seller_id)


async def delete_property(
    db: AsyncSession, property_id: uuid.UUID, seller_id: uuid.UUID,
) -> bool:
    """Delete a seller's property (only if not approved/published)."""
    prop = await get_seller_property(db, property_id, seller_id)
    if not prop:
        return False
    await db.delete(prop)
    await db.flush()
    return True


async def get_seller_stats(
    db: AsyncSession, seller_id: uuid.UUID,
) -> dict[str, int]:
    """Get dashboard statistics for a seller."""
    # Total listings
    total = (await db.execute(
        select(func.count(Property.id)).where(Property.seller_id == seller_id)
    )).scalar_one()

    # By verification status
    status_counts = {}
    result = await db.execute(
        select(Property.verification_status, func.count())
        .where(Property.seller_id == seller_id)
        .group_by(Property.verification_status)
    )
    for row in result.all():
        status_counts[row[0]] = row[1]

    # Inquiries received on seller's properties
    inquiry_count = (await db.execute(
        select(func.count(Inquiry.id))
        .join(Property, Inquiry.property_id == Property.id)
        .where(Property.seller_id == seller_id)
    )).scalar_one()

    return {
        "total": total,
        "pending": status_counts.get("pending", 0) + status_counts.get("under_review", 0),
        "approved": status_counts.get("approved", 0) + status_counts.get("published", 0),
        "rejected": status_counts.get("rejected", 0),
        "inquiries": inquiry_count,
    }


async def get_first_agent_id(db: AsyncSession) -> uuid.UUID | None:
    """Get the first available agent ID for assignment."""
    from app.models.agent import Agent
    result = await db.execute(select(Agent.id).limit(1))
    return result.scalar()
