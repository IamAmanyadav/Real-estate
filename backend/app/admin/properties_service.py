"""Admin properties service — business logic for property management & verification."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin import properties_repository as repo
from app.admin.properties_schemas import (
    AdminDocumentResponse,
    AdminPropertyResponse,
    AdminPropertyUpdate,
    PaginatedAdminProperties,
    StatusHistoryItem,
    VerificationUpdate,
)
from app.models.property import Property
from app.models.user import User
from app.sse.manager import sse_manager


def _to_response(prop: Property) -> AdminPropertyResponse:
    history = []
    for h in (prop.status_history or []):
        history.append(StatusHistoryItem(
            id=str(h.id),
            oldStatus=h.old_status,
            newStatus=h.new_status,
            changedBy=str(h.changed_by) if h.changed_by else None,
            changedByName=h.changed_by_user.full_name if h.changed_by_user else None,
            reason=h.reason,
            createdAt=h.created_at.isoformat() if h.created_at else "",
        ))

    return AdminPropertyResponse(
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
        verificationStatus=prop.verification_status,
        rejectionReason=prop.rejection_reason,
        verifiedBy=str(prop.verified_by) if prop.verified_by else None,
        verifiedAt=prop.verified_at.isoformat() if prop.verified_at else None,
        sellerId=str(prop.seller_id) if prop.seller_id else None,
        sellerName=prop.seller.full_name if prop.seller else None,
        createdAt=prop.created_at.isoformat() if prop.created_at else "",
        updatedAt=prop.updated_at.isoformat() if prop.updated_at else "",
        statusHistory=history,
        documents=[
            AdminDocumentResponse(
                id=str(d.id),
                documentType=d.document_type,
                documentUrl=d.document_url,
                documentName=d.document_name,
                status=d.status,
                adminNote=d.admin_note,
            )
            for d in (prop.documents or [])
        ],
    )


async def list_properties(
    db: AsyncSession,
    *,
    search: str | None = None,
    property_type: str | None = None,
    status: str | None = None,
    verification_status: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> PaginatedAdminProperties:
    items, total = await repo.list_properties(
        db,
        search=search,
        property_type=property_type,
        status=status,
        verification_status=verification_status,
        page=page,
        limit=limit,
    )
    total_pages = max(1, (total + limit - 1) // limit)
    return PaginatedAdminProperties(
        items=[_to_response(p) for p in items],
        total=total,
        page=page,
        limit=limit,
        totalPages=total_pages,
    )


async def get_property(db: AsyncSession, property_id: str) -> AdminPropertyResponse:
    try:
        uid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Property not found")
    prop = await repo.get_property_by_id(db, uid)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return _to_response(prop)


async def update_property(
    db: AsyncSession, property_id: str, data: AdminPropertyUpdate,
) -> AdminPropertyResponse:
    try:
        uid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Property not found")

    raw = data.model_dump(exclude_unset=True)
    mapping = {
        "zipCode": "zip_code",
        "propertyType": "property_type",
        "yearBuilt": "year_built",
    }
    updates = {}
    for k, v in raw.items():
        updates[mapping.get(k, k)] = v

    prop = await repo.update_property(db, uid, updates)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return _to_response(prop)


async def update_verification(
    db: AsyncSession,
    property_id: str,
    data: VerificationUpdate,
    admin: User,
) -> AdminPropertyResponse:
    try:
        uid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Property not found")

    prop = await repo.get_property_by_id(db, uid)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    old_status = prop.verification_status
    new_status = data.verification_status.value

    updates: dict = {
        "verification_status": new_status,
        "verified_by": admin.id,
        "verified_at": datetime.now(timezone.utc),
    }
    if new_status == "rejected":
        updates["rejection_reason"] = data.reason
    else:
        updates["rejection_reason"] = None

    prop = await repo.update_property(db, uid, updates)

    # Record status change history
    await repo.add_status_history(
        db,
        property_id=uid,
        old_status=old_status,
        new_status=new_status,
        changed_by=admin.id,
        reason=data.reason,
    )

    # Push SSE event to seller
    if prop and prop.seller_id:
        await sse_manager.broadcast(
            str(prop.seller_id),
            {
                "type": "property_status_changed",
                "propertyId": str(uid),
                "propertyTitle": prop.title,
                "oldStatus": old_status,
                "newStatus": new_status,
                "reason": data.reason,
            },
        )

    # Reload to get updated history
    prop = await repo.get_property_by_id(db, uid)
    return _to_response(prop)


async def delete_property(db: AsyncSession, property_id: str) -> bool:
    try:
        uid = uuid.UUID(property_id)
    except ValueError:
        return False
    return await repo.delete_property(db, uid)
