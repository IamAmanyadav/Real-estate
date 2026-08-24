"""FastAPI router for the Bidding / Live Auction system."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import (
    get_current_admin,
    get_current_user,
    get_optional_user,
    get_user_from_token,
)
from app.bidding.schemas import (
    AdminAuctionOverview,
    AdminBidResponse,
    AdminDecisionRequest,
    AnonymizedBidResponse,
    AuctionStateResponse,
    PlaceBidRequest,
    UpdateReservePriceRequest,
)
from app.bidding.service import BiddingService
from app.bidding.websocket_manager import auction_ws_manager
from app.db.deps import get_db
from app.models.bid import Bid
from app.models.property import Property
from app.models.user import User

logger = logging.getLogger("uvicorn.error")

router = APIRouter()


# ── Public / Buyer / Seller Endpoints ────────────────────────────────────────

@router.get("/{property_id}/state", response_model=AuctionStateResponse)
async def get_auction_state(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Retrieve the current live state of an auction (anonymized)."""
    service = BiddingService(db)
    return await service.get_auction_state(property_id, current_user)


@router.get("/{property_id}/history", response_model=list[AnonymizedBidResponse])
async def get_bid_history(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Retrieve anonymized bid history for buyers and sellers."""
    service = BiddingService(db)
    return await service.get_bid_history(property_id, current_user)


@router.post("/{property_id}/bid", response_model=AnonymizedBidResponse)
async def place_bid(
    property_id: uuid.UUID,
    body: PlaceBidRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Place a live bid on an active property auction."""
    service = BiddingService(db)
    return await service.place_bid(property_id, current_user, body)


@router.post("/{property_id}/update-reserve", response_model=AuctionStateResponse)
async def update_seller_reserve(
    property_id: uuid.UUID,
    body: UpdateReservePriceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allow seller to update lowest reserve price after auction ends or re-open bidding."""
    service = BiddingService(db)
    return await service.update_seller_reserve(property_id, current_user, body)


@router.get("/my-bids")
async def get_my_bids(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all bids placed by the currently authenticated user."""
    stmt = (
        select(Bid, Property)
        .join(Property, Bid.property_id == Property.id)
        .options(selectinload(Bid.property).selectinload(Property.images))
        .where(Bid.bidder_id == current_user.id)
        .order_by(Bid.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    items = []
    for bid, prop in rows:
        items.append({
            "id": str(bid.id),
            "property_id": str(prop.id),
            "property_title": prop.title,
            "property_code": prop.property_code,
            "property_image": prop.images[0].url if prop.images else None,
            "property_city": prop.city,
            "property_state": prop.state,
            "amount": float(bid.amount),
            "bid_status": bid.status,
            "is_outbid": bid.is_outbid,
            "created_at": bid.created_at.isoformat(),
            "auction_status": prop.auction_status,
            "current_highest_bid": float(prop.current_highest_bid) if prop.current_highest_bid else None,
            "is_winning": prop.highest_bidder_id == current_user.id,
        })
    return items


# ── Admin Endpoints ─────────────────────────────────────────────────────────

@router.get("/admin/auctions", response_model=list[AdminAuctionOverview])
async def get_admin_auctions(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin dashboard list of all auctions with full bidder and seller details."""
    service = BiddingService(db)
    return await service.get_admin_auctions()


@router.get("/admin/{property_id}/audit", response_model=list[AdminBidResponse])
async def get_admin_audit(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin full audit log showing real bidder identities and timestamps."""
    service = BiddingService(db)
    return await service.get_admin_audit_history(property_id)


@router.post("/admin/{property_id}/decision")
async def set_auction_decision(
    property_id: uuid.UUID,
    body: AdminDecisionRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin approves winning bid, marks rejected, or closes offline handover."""
    service = BiddingService(db)
    await service.set_auction_decision(property_id, body.status)
    return {"message": f"Auction status updated to {body.status} successfully."}


# ── WebSocket Endpoint ───────────────────────────────────────────────────────

@router.websocket("/ws/{property_id}")
async def auction_websocket_endpoint(
    websocket: WebSocket,
    property_id: str,
    token: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Real-time WebSocket connection for live auction price updates."""
    user_id: str | None = None
    if token:
        try:
            user = await get_user_from_token(token, db)
            user_id = str(user.id)
        except Exception:
            user_id = None

    await auction_ws_manager.connect(websocket, property_id, user_id)

    try:
        while True:
            # Keep connection alive; clients can send ping or subscribe messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        auction_ws_manager.disconnect(websocket, property_id)
    except Exception as err:
        logger.warning(f"Auction WebSocket error on {property_id}: {err}")
        auction_ws_manager.disconnect(websocket, property_id)
