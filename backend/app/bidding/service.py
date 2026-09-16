"""Bidding business logic service with concurrency locking, anti-sniping, and role-based privacy."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.bidding.schemas import (
    AdminAuctionOverview,
    AdminBidResponse,
    AnonymizedBidResponse,
    AuctionStateResponse,
    PlaceBidRequest,
    UpdateReservePriceRequest,
)
from app.bidding.websocket_manager import auction_ws_manager
from app.models.bid import Bid
from app.models.property import Property
from app.models.user import User

logger = logging.getLogger("uvicorn.error")


class BiddingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _check_and_update_expired_auction(self, prop: Property) -> bool:
        """Check if active auction time has passed and update status to ended.
        If no bids have been placed yet, the countdown has not started.
        """
        if not prop.is_auction or prop.auction_status != "active":
            return False
        if prop.current_highest_bid is None and prop.auction_start_date is None:
            # Waiting for 1st bid to start countdown
            return False
        now = datetime.now(timezone.utc)
        if prop.auction_end_date:
            end_date = prop.auction_end_date
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
            if end_date < now:
                prop.auction_status = "ended"
                self.db.add(prop)
                await self.db.flush()
                return True
        return False

    async def get_auction_state(
        self,
        property_id: uuid.UUID,
        current_user: User | None = None,
    ) -> AuctionStateResponse:
        """Get live state of an auction with calculated minimum next bid and remaining time."""
        result = await self.db.execute(
            select(Property).where(Property.id == property_id)
        )
        prop = result.scalar_one_or_none()
        if not prop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found.",
            )

        if not prop.is_auction:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This property is not configured for bidding.",
            )

        # Check expiration
        if await self._check_and_update_expired_auction(prop):
            await self.db.commit()
            await self.db.refresh(prop)

        # Count total bids
        bid_count_result = await self.db.execute(
            select(func.count(Bid.id)).where(Bid.property_id == property_id)
        )
        total_bids = bid_count_result.scalar() or 0

        # Calculate time remaining
        now = datetime.now(timezone.utc)
        time_remaining_seconds = 0.0
        is_first_bid_pending = bool(prop.current_highest_bid is None and prop.auction_start_date is None)

        if not is_first_bid_pending and prop.auction_end_date:
            end_date = prop.auction_end_date
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
            diff = (end_date - now).total_seconds()
            time_remaining_seconds = max(0.0, diff)

        # Maximum jump increment is strictly up to 10% of current price to maintain healthy price gap
        reserve = float(prop.reserve_price) if prop.reserve_price is not None else float(prop.price)
        if prop.current_highest_bid is not None:
            current_val = float(prop.current_highest_bid)
            max_increment = round(current_val * 0.10, 2)
            max_next_bid = round(current_val + max_increment, 2)
            min_next_bid = round(current_val + 1.0, 2)
            min_increment = 1.0
        else:
            current_val = reserve
            max_increment = round(reserve * 0.10, 2)
            max_next_bid = round(reserve + max_increment, 2)
            min_next_bid = reserve
            min_increment = 1.0

        is_seller = False
        if current_user:
            if prop.seller_id and (prop.seller_id == current_user.id or str(prop.seller_id) == str(current_user.id)):
                is_seller = True
            elif prop.agent and prop.agent.email and current_user.email and prop.agent.email.lower() == current_user.email.lower():
                is_seller = True

        is_highest_bidder = bool(
            current_user and prop.highest_bidder_id and (prop.highest_bidder_id == current_user.id or str(prop.highest_bidder_id) == str(current_user.id))
        )

        computed_status = "waiting_for_bids" if is_first_bid_pending else (prop.auction_status or ("active" if time_remaining_seconds > 0 else "ended"))

        return AuctionStateResponse(
            property_id=prop.id,
            title=prop.title,
            property_code=prop.property_code,
            property_image=prop.images[0].url if prop.images else None,
            is_auction=prop.is_auction,
            reserve_price=reserve,
            current_highest_bid=float(prop.current_highest_bid) if prop.current_highest_bid is not None else None,
            min_next_bid=min_next_bid,
            max_next_bid=max_next_bid,
            min_bid_increment=min_increment,
            max_bid_increment=max_increment,
            auction_start_date=prop.auction_start_date,
            auction_end_date=prop.auction_end_date,
            auction_status=computed_status,
            total_bids=total_bids,
            time_remaining_seconds=time_remaining_seconds,
            is_seller=is_seller,
            is_highest_bidder=is_highest_bidder,
            winning_bid_amount=float(prop.current_highest_bid) if prop.auction_status in ["ended", "accepted", "offline_completed"] and prop.current_highest_bid else None,
        )

    async def get_bid_history(
        self,
        property_id: uuid.UUID,
        current_user: User | None = None,
    ) -> list[AnonymizedBidResponse]:
        """Fetch anonymized bid history for buyers/sellers/public."""
        stmt = (
            select(Bid)
            .where(Bid.property_id == property_id)
            .order_by(Bid.created_at.desc())
        )
        result = await self.db.execute(stmt)
        bids = result.scalars().all()

        # Build consistent anonymous labels based on bidder ID order
        bidder_map: dict[uuid.UUID, str] = {}
        counter = 1

        # Determine order of unique bidders
        for b in reversed(bids):
            if b.bidder_id not in bidder_map:
                bidder_map[b.bidder_id] = f"Bidder #{counter}"
                counter += 1

        history: list[AnonymizedBidResponse] = []
        for b in bids:
            is_me = bool(current_user and b.bidder_id == current_user.id)
            label = "You" if is_me else bidder_map.get(b.bidder_id, "Bidder")
            history.append(
                AnonymizedBidResponse(
                    id=b.id,
                    property_id=b.property_id,
                    amount=float(b.amount),
                    created_at=b.created_at,
                    bidder_label=label,
                    status=b.status,
                    is_current_user=is_me,
                )
            )
        return history

    async def place_bid(
        self,
        property_id: uuid.UUID,
        bidder: User,
        data: PlaceBidRequest,
    ) -> AnonymizedBidResponse:
        """Place a bid with concurrency row-locking and anti-sniping extension."""
        # Row-level lock to prevent concurrent bid race conditions
        stmt = (
            select(Property)
            .where(Property.id == property_id)
            .with_for_update()
        )
        result = await self.db.execute(stmt)
        prop = result.scalar_one_or_none()

        if not prop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found.",
            )

        if not prop.is_auction:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bidding is not enabled for this property.",
            )

        # Seller/owner cannot bid on own property (Anti-fraud / Anti-shill bidding protection)
        is_owner = False
        if prop.seller_id and (prop.seller_id == bidder.id or str(prop.seller_id) == str(bidder.id)):
            is_owner = True
        elif prop.agent and prop.agent.email and bidder.email and prop.agent.email.lower() == bidder.email.lower():
            is_owner = True

        if is_owner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Anti-fraud policy: You cannot place bids on your own listed property.",
            )

        now = datetime.now(timezone.utc)
        is_first_bid = bool(prop.current_highest_bid is None or prop.auction_start_date is None)

        if not is_first_bid:
            # Check auction expiration only if auction was already active and running
            if prop.auction_end_date:
                end_date = prop.auction_end_date
                if end_date.tzinfo is None:
                    end_date = end_date.replace(tzinfo=timezone.utc)
                if now >= end_date or prop.auction_status == "ended":
                    prop.auction_status = "ended"
                    await self.db.commit()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="This auction has already ended.",
                    )

        # Single-bid validation: Maximum 10% increment over current price to maintain healthy price gap
        reserve = float(prop.reserve_price) if prop.reserve_price is not None else float(prop.price)
        current_highest = float(prop.current_highest_bid) if prop.current_highest_bid is not None else None

        if current_highest is None:
            current_base = reserve
            min_required = reserve
            max_increment = round(current_base * 0.10, 2)
            max_allowed = round(current_base + max_increment, 2)
        else:
            current_base = current_highest
            min_required = round(current_highest + 1.0, 2)
            max_increment = round(current_base * 0.10, 2)
            max_allowed = round(current_base + max_increment, 2)

        if data.amount < min_required:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bid must be at least ₹{min_required:,.2f} (higher than current price ₹{current_base:,.2f}).",
            )

        if data.amount > max_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"In a single bid, you can only bid up to 10% over the current price (₹{max_allowed:,.2f} max). Current price is ₹{current_base:,.2f} and max 10% jump is ₹{max_increment:,.2f}.",
            )

        # Mark all prior bids for this property as outbid
        await self.db.execute(
            update(Bid)
            .where(Bid.property_id == property_id, Bid.status == "active")
            .values(status="outbid", is_outbid=True)
        )

        # Create new active bid
        new_bid = Bid(
            property_id=property_id,
            bidder_id=bidder.id,
            amount=data.amount,
            status="active",
            is_outbid=False,
        )
        self.db.add(new_bid)

        # Update property highest bid & bidder
        prop.current_highest_bid = data.amount
        prop.highest_bidder_id = bidder.id
        prop.auction_status = "active"

        # Timer initiation / Anti-sniping
        extended = False
        if is_first_bid:
            # The timer starts ticking right now upon the first bid!
            prop.auction_start_date = now
            duration_secs = 86400.0  # Default 24h
            if prop.auction_end_date:
                orig_end = prop.auction_end_date
                if orig_end.tzinfo is None:
                    orig_end = orig_end.replace(tzinfo=timezone.utc)
                diff = (orig_end - now).total_seconds()
                if diff > 1800:
                    duration_secs = diff
            prop.auction_end_date = now + timedelta(seconds=duration_secs)
            logger.info(f"Auction {property_id} dynamic timer STARTED upon first bid! Ends at {prop.auction_end_date}")
        else:
            # Anti-sniping: If bid is submitted within 1 hour (3600 seconds) of end, increase end time by 1 more day (24h)
            if prop.auction_end_date:
                end_date = prop.auction_end_date
                if end_date.tzinfo is None:
                    end_date = end_date.replace(tzinfo=timezone.utc)
                time_left = (end_date - now).total_seconds()
                if time_left <= 3600:
                    new_end = end_date + timedelta(days=1)
                    prop.auction_end_date = new_end
                    extended = True
                    logger.info(f"Auction {property_id} auto-extended by 1 day due to bid within final 1 hour. New end: {new_end}")

        await self.db.commit()
        await self.db.refresh(new_bid)
        await self.db.refresh(prop)

        # Broadcast real-time update to all listeners in this property's auction room
        diff_seconds = 0.0
        if prop.auction_end_date:
            end_d = prop.auction_end_date
            if end_d.tzinfo is None:
                end_d = end_d.replace(tzinfo=timezone.utc)
            diff_seconds = max(0.0, (end_d - datetime.now(timezone.utc)).total_seconds())

        curr_bid = float(prop.current_highest_bid)
        next_max_inc = round(curr_bid * 0.10, 2)
        next_max_next_bid = round(curr_bid + next_max_inc, 2)
        next_min_next_bid = round(curr_bid + 1.0, 2)
        await auction_ws_manager.broadcast_to_room(
            str(property_id),
            {
                "event": "NEW_BID",
                "property_id": str(property_id),
                "current_highest_bid": curr_bid,
                "min_bid_increment": 1.0,
                "min_next_bid": next_min_next_bid,
                "max_bid_increment": next_max_inc,
                "max_next_bid": next_max_next_bid,
                "time_remaining_seconds": diff_seconds,
                "extended": extended,
                "bid": {
                    "id": str(new_bid.id),
                    "amount": float(new_bid.amount),
                    "created_at": new_bid.created_at.isoformat(),
                    "bidder_label": "New Bidder",
                    "status": new_bid.status,
                },
            },
        )

        return AnonymizedBidResponse(
            id=new_bid.id,
            property_id=new_bid.property_id,
            amount=float(new_bid.amount),
            created_at=new_bid.created_at,
            bidder_label="You",
            status=new_bid.status,
            is_current_user=True,
        )

    async def update_seller_reserve(
        self,
        property_id: uuid.UUID,
        seller: User,
        data: UpdateReservePriceRequest,
    ) -> AuctionStateResponse:
        """Allow seller to update/increase lowest bid price or extend auction after it has ended."""
        stmt = select(Property).where(Property.id == property_id)
        result = await self.db.execute(stmt)
        prop = result.scalar_one_or_none()

        if not prop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found.",
            )

        if prop.seller_id != seller.id and seller.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to update this property's reserve price.",
            )

        # Update reserve price
        prop.reserve_price = data.reserve_price
        
        # If auction ended and seller wants to reopen with extension
        if data.extend_days and data.extend_days > 0:
            now = datetime.now(timezone.utc)
            prop.auction_start_date = now
            prop.auction_end_date = now + timedelta(days=data.extend_days)
            prop.auction_status = "active"

        await self.db.commit()
        await self.db.refresh(prop)

        # Broadcast update to room
        await auction_ws_manager.broadcast_to_room(
            str(property_id),
            {
                "event": "RESERVE_UPDATED",
                "property_id": str(property_id),
                "reserve_price": float(prop.reserve_price),
                "auction_status": prop.auction_status,
                "auction_end_date": prop.auction_end_date.isoformat() if prop.auction_end_date else None,
            },
        )

        return await self.get_auction_state(property_id, seller)

    # ── Admin Only Methods ──────────────────────────────────────────────────

    async def get_admin_auctions(self) -> list[AdminAuctionOverview]:
        """Admin list of all properties configured for auction with full bidder information."""
        stmt = (
            select(Property)
            .where(or_(Property.is_auction.is_(True), Property.bids.any()))
            .options(
                selectinload(Property.seller),
                selectinload(Property.highest_bidder),
                selectinload(Property.images),
                selectinload(Property.bids).selectinload(Bid.bidder),
            )
            .order_by(Property.created_at.desc())
        )
        result = await self.db.execute(stmt)
        props = result.scalars().all()

        overview: list[AdminAuctionOverview] = []
        now = datetime.now(timezone.utc)

        for p in props:
            # Count bids
            bid_count = await self.db.execute(
                select(func.count(Bid.id)).where(Bid.property_id == p.id)
            )
            total_bids = bid_count.scalar() or 0

            time_remaining = 0.0
            if p.auction_end_date:
                end_d = p.auction_end_date
                if end_d.tzinfo is None:
                    end_d = end_d.replace(tzinfo=timezone.utc)
                time_remaining = max(0.0, (end_d - now).total_seconds())

            # Determine highest bidder (from relation or highest active bid)
            hb = p.highest_bidder
            if not hb and p.bids:
                active_bids = [b for b in p.bids if b.status == "active" or not b.is_outbid]
                top_b = active_bids[0] if active_bids else p.bids[0]
                hb = top_b.bidder

            # Build full property-wise bid audit list with complete bidder identities
            raw_bids = p.bids or []
            sorted_bids = sorted(raw_bids, key=lambda b: b.created_at, reverse=True)
            prop_bids = [
                AdminBidResponse(
                    id=b.id,
                    property_id=b.property_id,
                    bidder_id=b.bidder_id,
                    bidder_name=(b.bidder.full_name if b.bidder and b.bidder.full_name else (b.bidder.email if b.bidder else "Unknown Bidder")),
                    bidder_email=b.bidder.email if b.bidder else "Unknown",
                    bidder_phone=b.bidder.phone if b.bidder else None,
                    amount=float(b.amount),
                    status=b.status,
                    is_outbid=b.is_outbid,
                    created_at=b.created_at,
                )
                for b in sorted_bids
            ]

            overview.append(
                AdminAuctionOverview(
                    property_id=p.id,
                    title=p.title,
                    property_code=p.property_code,
                    property_image=p.images[0].url if p.images else None,
                    seller_name=p.seller.full_name if p.seller else None,
                    seller_email=p.seller.email if p.seller else None,
                    reserve_price=float(p.reserve_price) if p.reserve_price is not None else float(p.price),
                    current_highest_bid=float(p.current_highest_bid) if p.current_highest_bid is not None else (float(sorted_bids[0].amount) if sorted_bids else None),
                    highest_bidder_id=hb.id if hb else p.highest_bidder_id,
                    highest_bidder_name=(hb.full_name if hb and hb.full_name else (hb.email if hb else None)),
                    highest_bidder_email=hb.email if hb else None,
                    highest_bidder_phone=hb.phone if hb else None,
                    auction_start_date=p.auction_start_date,
                    auction_end_date=p.auction_end_date,
                    auction_status=p.auction_status or ("active" if time_remaining > 0 else "ended"),
                    total_bids=total_bids,
                    time_remaining_seconds=time_remaining,
                    bids=prop_bids,
                )
            )
        return overview

    async def get_admin_audit_history(
        self,
        property_id: uuid.UUID,
    ) -> list[AdminBidResponse]:
        """Admin full audit trail of every bid with complete user contact info."""
        stmt = (
            select(Bid)
            .where(Bid.property_id == property_id)
            .options(selectinload(Bid.bidder))
            .order_by(Bid.created_at.desc())
        )
        result = await self.db.execute(stmt)
        bids = result.scalars().all()

        return [
            AdminBidResponse(
                id=b.id,
                property_id=b.property_id,
                bidder_id=b.bidder_id,
                bidder_name=(b.bidder.full_name if b.bidder and b.bidder.full_name else (b.bidder.email if b.bidder else "Unknown Bidder")),
                bidder_email=b.bidder.email if b.bidder else "Unknown",
                bidder_phone=b.bidder.phone if b.bidder else None,
                amount=float(b.amount),
                status=b.status,
                is_outbid=b.is_outbid,
                created_at=b.created_at,
            )
            for b in bids
        ]

    async def set_auction_decision(
        self,
        property_id: uuid.UUID,
        target_status: str,
    ) -> None:
        """Admin/Seller sets winning bid decision (accepted, rejected, offline_completed)."""
        valid_statuses = ["accepted", "rejected", "offline_completed", "cancelled"]
        if target_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {valid_statuses}",
            )

        stmt = select(Property).where(Property.id == property_id)
        result = await self.db.execute(stmt)
        prop = result.scalar_one_or_none()
        if not prop:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

        prop.auction_status = target_status
        if target_status == "offline_completed":
            prop.status = "sold"

        # Update winning bid status
        if prop.highest_bidder_id:
            await self.db.execute(
                update(Bid)
                .where(
                    Bid.property_id == property_id,
                    Bid.bidder_id == prop.highest_bidder_id,
                    Bid.is_outbid.is_(False),
                )
                .values(status="accepted" if target_status in ["accepted", "offline_completed"] else "rejected")
            )

        await self.db.commit()

        # Broadcast status update
        await auction_ws_manager.broadcast_to_room(
            str(property_id),
            {
                "event": "AUCTION_STATUS_CHANGED",
                "property_id": str(property_id),
                "auction_status": target_status,
            },
        )
