"""Admin property management API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_admin
from app.db.deps import get_db
from app.admin import properties_service as service
from app.admin.properties_schemas import (
    AdminPropertyResponse,
    AdminPropertyUpdate,
    PaginatedAdminProperties,
    VerificationUpdate,
)
from app.models.user import User

router = APIRouter()


@router.get("", response_model=PaginatedAdminProperties)
async def list_properties(
    search: str | None = Query(None),
    property_type: str | None = Query(None, alias="propertyType"),
    status: str | None = Query(None),
    verification_status: str | None = Query(None, alias="verificationStatus"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return await service.list_properties(
        db,
        search=search,
        property_type=property_type,
        status=status,
        verification_status=verification_status,
        page=page,
        limit=limit,
    )


@router.get("/{property_id}", response_model=AdminPropertyResponse)
async def get_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return await service.get_property(db, property_id)


@router.put("/{property_id}", response_model=AdminPropertyResponse)
async def update_property(
    property_id: str,
    data: AdminPropertyUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return await service.update_property(db, property_id, data)


@router.patch("/{property_id}/verification", response_model=AdminPropertyResponse)
async def update_verification(
    property_id: str,
    data: VerificationUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await service.update_verification(db, property_id, data, admin)


@router.delete("/{property_id}", status_code=204)
async def delete_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    if not await service.delete_property(db, property_id):
        raise HTTPException(status_code=404, detail="Property not found")
