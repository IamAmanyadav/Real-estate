"""Properties repository — pure SQLAlchemy CRUD operations."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.property import Property, PropertyImage, PropertyFeature
from app.models.agent import Agent


async def list_properties(
    db: AsyncSession,
    *,
    location: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    bedrooms: int | None = None,
    bathrooms: int | None = None,
    property_type: str | None = None,
    sort_by: str | None = None,
    page: int = 1,
    limit: int = 12,
) -> tuple[list[Property], int]:
    """Return (items, total_count) with filtering, sorting, and pagination."""

    query = select(Property).options(
        selectinload(Property.agent),
        selectinload(Property.images),
        selectinload(Property.features),
    )

    # ── Only show approved/published properties to the public ────────────
    query = query.where(
        Property.verification_status.in_(["approved", "published"])
    )

    # ── Filters ──────────────────────────────────────────────────────────
    if location:
        loc = f"%{location.lower()}%"
        query = query.where(
            func.lower(
                func.concat(Property.city, " ", Property.state, " ", Property.address, " ", Property.zip_code)
            ).like(loc)
        )
    if min_price is not None:
        query = query.where(Property.price >= min_price)
    if max_price is not None:
        query = query.where(Property.price <= max_price)
    if bedrooms is not None:
        query = query.where(Property.bedrooms >= bedrooms)
    if bathrooms is not None:
        query = query.where(Property.bathrooms >= bathrooms)
    if property_type is not None:
        query = query.where(Property.property_type == property_type)

    # ── Count before pagination ──────────────────────────────────────────
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    # ── Sort ─────────────────────────────────────────────────────────────
    if sort_by == "price_asc":
        query = query.order_by(Property.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Property.price.desc())
    elif sort_by == "oldest":
        query = query.order_by(Property.created_at.asc())
    else:  # newest (default)
        query = query.order_by(Property.created_at.desc())

    # ── Paginate ─────────────────────────────────────────────────────────
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    items = list(result.scalars().unique().all())

    return items, total


async def get_property_by_id(
    db: AsyncSession, property_id: uuid.UUID,
) -> Property | None:
    """Get a single property by UUID with all relationships loaded."""
    query = (
        select(Property)
        .options(
            selectinload(Property.agent),
            selectinload(Property.images),
            selectinload(Property.features),
        )
        .where(Property.id == property_id)
    )
    result = await db.execute(query)
    return result.scalars().first()


async def create_property(
    db: AsyncSession,
    *,
    data: dict[str, Any],
    agent_id: uuid.UUID,
    images: list[str],
    features: list[str],
) -> Property:
    """Create a new property with images and features."""
    prop = Property(
        **data,
        agent_id=agent_id,
        images=[PropertyImage(url=url, sort_order=i) for i, url in enumerate(images)],
        features=[PropertyFeature(name=name) for name in features],
    )
    db.add(prop)
    await db.flush()
    # Reload with relationships
    return await get_property_by_id(db, prop.id)  # type: ignore[return-value]


async def update_property(
    db: AsyncSession, property_id: uuid.UUID, updates: dict[str, Any],
) -> Property | None:
    """Apply partial updates to a property."""
    prop = await get_property_by_id(db, property_id)
    if not prop:
        return None

    for key, value in updates.items():
        if key == "images":
            # Replace images
            prop.images.clear()
            for i, url in enumerate(value):
                prop.images.append(PropertyImage(url=url, sort_order=i))
        elif key == "features":
            prop.features.clear()
            for name in value:
                prop.features.append(PropertyFeature(name=name))
        else:
            setattr(prop, key, value)

    await db.flush()
    return await get_property_by_id(db, property_id)


async def delete_property(
    db: AsyncSession, property_id: uuid.UUID,
) -> bool:
    """Delete a property; returns True if found and deleted."""
    prop = await get_property_by_id(db, property_id)
    if not prop:
        return False
    await db.delete(prop)
    await db.flush()
    return True
