"""Admin properties repository — SQLAlchemy CRUD with verification support."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.property import Property, PropertyImage, PropertyFeature
from app.models.status_history import PropertyStatusHistory


async def list_properties(
    db: AsyncSession,
    *,
    search: str | None = None,
    property_type: str | None = None,
    status: str | None = None,
    verification_status: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Property], int]:
    """Return (properties, total) with admin filtering and pagination."""
    query = select(Property).options(
        selectinload(Property.agent),
        selectinload(Property.images),
        selectinload(Property.features),
        selectinload(Property.seller),
        selectinload(Property.status_history),
        selectinload(Property.documents),
    )

    if search:
        term = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(Property.title).like(term),
                func.lower(Property.city).like(term),
                func.lower(Property.address).like(term),
            )
        )
    if property_type:
        query = query.where(Property.property_type == property_type)
    if status:
        query = query.where(Property.status == status)
    if verification_status:
        query = query.where(Property.verification_status == verification_status)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    query = query.order_by(Property.created_at.desc())
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    return list(result.scalars().unique().all()), total


async def get_property_by_id(
    db: AsyncSession, property_id: uuid.UUID,
) -> Property | None:
    query = (
        select(Property)
        .options(
            selectinload(Property.agent),
            selectinload(Property.images),
            selectinload(Property.features),
            selectinload(Property.seller),
            selectinload(Property.status_history).selectinload(
                PropertyStatusHistory.changed_by_user
            ),
            selectinload(Property.documents),
        )
        .where(Property.id == property_id)
    )
    result = await db.execute(query)
    return result.scalars().first()


async def update_property(
    db: AsyncSession, property_id: uuid.UUID, updates: dict[str, Any],
) -> Property | None:
    prop = await get_property_by_id(db, property_id)
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
        else:
            setattr(prop, key, value)

    await db.flush()
    return await get_property_by_id(db, property_id)


async def add_status_history(
    db: AsyncSession,
    *,
    property_id: uuid.UUID,
    old_status: str | None,
    new_status: str,
    changed_by: uuid.UUID,
    reason: str | None = None,
) -> PropertyStatusHistory:
    entry = PropertyStatusHistory(
        property_id=property_id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        reason=reason,
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


async def delete_property(db: AsyncSession, property_id: uuid.UUID) -> bool:
    prop = await get_property_by_id(db, property_id)
    if not prop:
        return False
    await db.delete(prop)
    await db.flush()
    return True


async def count_properties_by_verification_status(db: AsyncSession) -> dict[str, int]:
    query = (
        select(Property.verification_status, func.count())
        .group_by(Property.verification_status)
    )
    result = await db.execute(query)
    return {row[0]: row[1] for row in result.all()}


async def count_properties_by_type(db: AsyncSession) -> dict[str, int]:
    query = (
        select(Property.property_type, func.count())
        .group_by(Property.property_type)
    )
    result = await db.execute(query)
    return {row[0]: row[1] for row in result.all()}
