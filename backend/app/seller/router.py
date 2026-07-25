"""Seller property management API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_seller
from app.db.deps import get_db
from app.models.user import User
from app.seller import service
from app.seller.schemas import (
    PaginatedSellerProperties,
    SellerDashboardStats,
    SellerPropertyCreate,
    SellerPropertyResponse,
    SellerPropertyUpdate,
)

router = APIRouter()


@router.get("/properties", response_model=PaginatedSellerProperties)
async def list_properties(
    verification_status: str | None = Query(None, alias="verificationStatus"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(get_current_seller),
):
    """List the authenticated seller's properties."""
    return await service.list_properties(
        db, seller.id,
        verification_status=verification_status,
        page=page, limit=limit,
    )


@router.get("/dashboard-stats", response_model=SellerDashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(get_current_seller),
):
    """Get dashboard statistics for the seller."""
    return await service.get_dashboard_stats(db, seller.id)


@router.get("/properties/{property_id}", response_model=SellerPropertyResponse)
async def get_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(get_current_seller),
):
    """Get a single property owned by the seller."""
    return await service.get_property(db, property_id, seller.id)


@router.post("/properties", response_model=SellerPropertyResponse, status_code=201)
async def create_property(
    data: SellerPropertyCreate,
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(get_current_seller),
):
    """Create a new property listing (pending verification)."""
    return await service.create_property(db, data, seller.id)


@router.put("/properties/{property_id}", response_model=SellerPropertyResponse)
async def update_property(
    property_id: str,
    data: SellerPropertyUpdate,
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(get_current_seller),
):
    """Update a property (only pending/rejected)."""
    return await service.update_property(db, property_id, data, seller.id)


@router.delete("/properties/{property_id}", status_code=204)
async def delete_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(get_current_seller),
):
    """Delete a property (only pending/rejected)."""
    if not await service.delete_property(db, property_id, seller.id):
        raise HTTPException(status_code=404, detail="Property not found")
