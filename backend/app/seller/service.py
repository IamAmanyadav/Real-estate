"""Seller properties service — business logic for seller property management."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.property import Property
from app.seller import repository as repo
from app.seller.schemas import (
    DocumentResponse,
    PaginatedSellerProperties,
    SellerDashboardStats,
    SellerPropertyCreate,
    SellerPropertyResponse,
    SellerPropertyUpdate,
)


def _doc_to_response(doc) -> DocumentResponse:
    return DocumentResponse(
        id=str(doc.id),
        documentType=doc.document_type,
        documentUrl=doc.document_url,
        documentName=doc.document_name,
        status=doc.status,
        adminNote=doc.admin_note,
    )


def _to_response(prop: Property) -> SellerPropertyResponse:
    """Convert a SQLAlchemy Property model to the seller API response."""
    return SellerPropertyResponse(
        id=str(prop.id),
        propertyId=prop.property_code or f"LXE-{str(prop.id).split('-')[0].upper()}",
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
        documents=[_doc_to_response(d) for d in (prop.documents or [])],
        verificationStatus=prop.verification_status,
        rejectionReason=prop.rejection_reason,
        isAuction=bool(prop.is_auction),
        reservePrice=float(prop.reserve_price) if prop.reserve_price is not None else float(prop.price),
        currentHighestBid=float(prop.current_highest_bid) if prop.current_highest_bid is not None else None,
        auctionStartDate=prop.auction_start_date.isoformat() if prop.auction_start_date else None,
        auctionEndDate=prop.auction_end_date.isoformat() if prop.auction_end_date else None,
        minBidIncrement=float(prop.min_bid_increment) if prop.min_bid_increment is not None else 1000.0,
        auctionStatus=prop.auction_status,
        createdAt=prop.created_at.isoformat() if prop.created_at else "",
        updatedAt=prop.updated_at.isoformat() if prop.updated_at else "",
    )


async def list_properties(
    db: AsyncSession,
    seller_id: uuid.UUID,
    *,
    verification_status: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> PaginatedSellerProperties:
    items, total = await repo.list_seller_properties(
        db, seller_id,
        verification_status=verification_status,
        page=page, limit=limit,
    )
    total_pages = max(1, (total + limit - 1) // limit)
    return PaginatedSellerProperties(
        items=[_to_response(p) for p in items],
        total=total,
        page=page,
        limit=limit,
        totalPages=total_pages,
    )


async def get_property(
    db: AsyncSession, property_id: str, seller_id: uuid.UUID,
) -> SellerPropertyResponse:
    try:
        uid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Property not found")
    prop = await repo.get_seller_property(db, uid, seller_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return _to_response(prop)


async def create_property(
    db: AsyncSession, data: SellerPropertyCreate, seller_id: uuid.UUID,
) -> SellerPropertyResponse:
    # Get or create a default agent for property assignment
    agent_id = await repo.get_first_agent_id(db)
    if not agent_id:
        from app.models.agent import Agent
        default_agent = Agent(
            name="Estate Verification Consultant",
            email="verification@realestate.in",
            phone="+91 9876543210",
            avatar="/images/default-avatar.png",
            title="Senior Property Consultant",
        )
        db.add(default_agent)
        await db.flush()
        agent_id = default_agent.id

    dump = data.model_dump(exclude={"images", "features", "documents"})
    
    # All seller properties are listed with Live Dynamic Auction mode enabled by default
    is_auction = True

    auction_start = None
    if dump.get("auctionStartDate"):
        try:
            auction_start = datetime.fromisoformat(dump["auctionStartDate"].replace("Z", "+00:00"))
        except Exception:
            auction_start = None

    auction_end = None
    if dump.get("auctionEndDate"):
        try:
            auction_end = datetime.fromisoformat(dump["auctionEndDate"].replace("Z", "+00:00"))
        except Exception:
            auction_end = None
    else:
        # Default 24-hour reference duration until 1st bid triggers active countdown
        auction_end = datetime.now(timezone.utc) + timedelta(hours=24)

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
        "is_auction": True,
        "reserve_price": dump.get("reservePrice") or dump["price"],
        "auction_start_date": auction_start,
        "auction_end_date": auction_end,
        "min_bid_increment": dump.get("minBidIncrement", 1000.0) or 1000.0,
        "auction_status": "draft",
    }

    doc_dicts = [d.model_dump() for d in data.documents]

    prop = await repo.create_property(
        db,
        data=prop_data,
        seller_id=seller_id,
        agent_id=agent_id,
        images=data.images,
        features=data.features,
        documents=doc_dicts,
    )
    return _to_response(prop)


async def update_property(
    db: AsyncSession, property_id: str, data: SellerPropertyUpdate,
    seller_id: uuid.UUID,
) -> SellerPropertyResponse:
    try:
        uid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Property not found")

    # Check ownership
    prop = await repo.get_seller_property(db, uid, seller_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Only allow edits on pending/rejected properties
    if prop.verification_status not in ("pending", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit property with status '{prop.verification_status}'. "
                   "Only pending or rejected properties can be edited.",
        )

    raw = data.model_dump(exclude_unset=True)
    mapping = {
        "zipCode": "zip_code",
        "propertyType": "property_type",
        "yearBuilt": "year_built",
        "isAuction": "is_auction",
        "reservePrice": "reserve_price",
        "minBidIncrement": "min_bid_increment",
    }
    updates: dict = {}
    for k, v in raw.items():
        if k == "documents":
            updates["documents"] = [d.model_dump() for d in data.documents] if data.documents else []
        elif k == "auctionStartDate" and v:
            try:
                updates["auction_start_date"] = datetime.fromisoformat(v.replace("Z", "+00:00"))
            except Exception:
                pass
        elif k == "auctionEndDate" and v:
            try:
                updates["auction_end_date"] = datetime.fromisoformat(v.replace("Z", "+00:00"))
            except Exception:
                pass
        else:
            db_key = mapping.get(k, k)
            updates[db_key] = v

    prop = await repo.update_property(db, uid, seller_id, updates)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return _to_response(prop)


async def delete_property(
    db: AsyncSession, property_id: str, seller_id: uuid.UUID,
) -> bool:
    try:
        uid = uuid.UUID(property_id)
    except ValueError:
        return False

    # Check ownership and status
    prop = await repo.get_seller_property(db, uid, seller_id)
    if not prop:
        return False
    if prop.verification_status in ("approved", "published"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete an approved/published property. Contact admin.",
        )

    return await repo.delete_property(db, uid, seller_id)


async def get_dashboard_stats(
    db: AsyncSession, seller_id: uuid.UUID,
) -> SellerDashboardStats:
    stats = await repo.get_seller_stats(db, seller_id)
    return SellerDashboardStats(
        totalListings=stats["total"],
        pendingListings=stats["pending"],
        approvedListings=stats["approved"],
        publishedListings=stats["published"],
        soldListings=stats["sold"],
        archivedListings=stats["archived"],
        rejectedListings=stats["rejected"],
        totalInquiriesReceived=stats["inquiries"],
    )
