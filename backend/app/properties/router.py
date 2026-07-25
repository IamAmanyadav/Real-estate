"""Property API endpoints — async DB-backed."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.deps import get_db
from app.properties import service
from app.properties.schemas import (
    PaginatedProperties,
    PropertyCreate,
    PropertyResponse,
    PropertyType,
    PropertyUpdate,
    SortOption,
)

router = APIRouter()


@router.get("", response_model=PaginatedProperties)
async def list_properties(
    location: str | None = Query(None),
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    bedrooms: int | None = Query(None, ge=0),
    bathrooms: int | None = Query(None, ge=0),
    property_type: PropertyType | None = Query(None),
    sort_by: SortOption | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_properties(
        db,
        location=location,
        min_price=min_price,
        max_price=max_price,
        bedrooms=bedrooms,
        bathrooms=bathrooms,
        property_type=property_type,
        sort_by=sort_by,
        page=page,
        limit=limit,
    )


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: str, db: AsyncSession = Depends(get_db)):
    prop = await service.get_property(db, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.post("", response_model=PropertyResponse, status_code=201)
async def create_property(data: PropertyCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_property(db, data)


@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: str, data: PropertyUpdate, db: AsyncSession = Depends(get_db),
):
    prop = await service.update_property(db, property_id, data)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.delete("/{property_id}", status_code=204)
async def delete_property(property_id: str, db: AsyncSession = Depends(get_db)):
    if not await service.delete_property(db, property_id):
        raise HTTPException(status_code=404, detail="Property not found")
