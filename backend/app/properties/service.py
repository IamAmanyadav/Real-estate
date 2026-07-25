"""Business logic for properties — DB-backed version."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.property import Property
from app.properties import repository
from app.properties.schemas import (
    PaginatedProperties,
    PropertyCreate,
    PropertyResponse,
    PropertyType,
    PropertyUpdate,
    SortOption,
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _to_response(prop: Property) -> PropertyResponse:
    """Convert a SQLAlchemy Property model to the camelCase API response."""
    return PropertyResponse(
        id=str(prop.id),
        title=prop.title,
        description=prop.description,
        price=float(prop.price),
        address=prop.address,
        city=prop.city,
        state=prop.state,
        zipCode=prop.zip_code,
        country=prop.country,
        latitude=prop.latitude,
        longitude=prop.longitude,
        bedrooms=prop.bedrooms,
        bathrooms=prop.bathrooms,
        area=prop.area,
        propertyType=prop.property_type,
        status=prop.status,
        yearBuilt=prop.year_built,
        images=[img.url for img in prop.images],
        features=[f.name for f in prop.features],
        agent=dict(
            id=str(prop.agent.id),
            name=prop.agent.name,
            email=prop.agent.email,
            phone=prop.agent.phone,
            avatar=prop.agent.avatar,
            title=prop.agent.title,
        ),
        createdAt=prop.created_at.isoformat() if prop.created_at else "",
        updatedAt=prop.updated_at.isoformat() if prop.updated_at else "",
    )


# ── Public API ───────────────────────────────────────────────────────────────

async def list_properties(
    db: AsyncSession,
    *,
    location: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    bedrooms: int | None = None,
    bathrooms: int | None = None,
    property_type: PropertyType | None = None,
    sort_by: SortOption | None = None,
    page: int = 1,
    limit: int = 12,
) -> PaginatedProperties:
    items, total = await repository.list_properties(
        db,
        location=location,
        min_price=min_price,
        max_price=max_price,
        bedrooms=bedrooms,
        bathrooms=bathrooms,
        property_type=property_type.value if property_type else None,
        sort_by=sort_by.value if sort_by else None,
        page=page,
        limit=limit,
    )

    total_pages = max(1, (total + limit - 1) // limit)

    return PaginatedProperties(
        items=[_to_response(p) for p in items],
        total=total,
        page=page,
        limit=limit,
        totalPages=total_pages,
    )


async def get_property(db: AsyncSession, property_id: str) -> PropertyResponse | None:
    try:
        uid = uuid.UUID(property_id)
    except ValueError:
        return None
    prop = await repository.get_property_by_id(db, uid)
    return _to_response(prop) if prop else None


async def create_property(db: AsyncSession, data: PropertyCreate) -> PropertyResponse:
    dump = data.model_dump(exclude={"agent", "images", "features"})
    # Map camelCase fields to snake_case DB columns
    prop_data = {
        "title": dump["title"],
        "description": dump["description"],
        "price": dump["price"],
        "address": dump["address"],
        "city": dump["city"],
        "state": dump["state"],
        "zip_code": dump["zipCode"],
        "country": dump["country"],
        "latitude": dump.get("latitude"),
        "longitude": dump.get("longitude"),
        "bedrooms": dump["bedrooms"],
        "bathrooms": dump["bathrooms"],
        "area": dump["area"],
        "property_type": dump["propertyType"],
        "status": dump["status"],
        "year_built": dump["yearBuilt"],
    }
    # TODO: look up or create agent by id
    agent_id = uuid.UUID(data.agent.id)

    prop = await repository.create_property(
        db, data=prop_data, agent_id=agent_id,
        images=data.images, features=data.features,
    )
    return _to_response(prop)


async def update_property(
    db: AsyncSession, property_id: str, data: PropertyUpdate,
) -> PropertyResponse | None:
    try:
        uid = uuid.UUID(property_id)
    except ValueError:
        return None

    raw = data.model_dump(exclude_unset=True)
    # Map camelCase → snake_case
    mapping = {
        "zipCode": "zip_code",
        "propertyType": "property_type",
        "yearBuilt": "year_built",
    }
    updates: dict = {}
    for k, v in raw.items():
        db_key = mapping.get(k, k)
        updates[db_key] = v

    prop = await repository.update_property(db, uid, updates)
    return _to_response(prop) if prop else None


async def delete_property(db: AsyncSession, property_id: str) -> bool:
    try:
        uid = uuid.UUID(property_id)
    except ValueError:
        return False
    return await repository.delete_property(db, uid)
