"""Pydantic schemas for the Bidding / Auction system."""

from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PlaceBidRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Bid amount")


class AnonymizedBidResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: uuid.UUID
    amount: float
    created_at: datetime
    bidder_label: str  # e.g. "Bidder #1", "Bidder #2", or "You"
    status: str
    is_current_user: bool = False


class AdminBidResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: uuid.UUID
    bidder_id: uuid.UUID
    bidder_name: str
    bidder_email: str
    bidder_phone: str | None = None
    amount: float
    status: str
    is_outbid: bool
    created_at: datetime


class AuctionStateResponse(BaseModel):
    property_id: uuid.UUID
    title: str
    property_code: str | None = None
    property_image: str | None = None
    is_auction: bool
    reserve_price: float | None = None  # Lowest acceptable sell price
    current_highest_bid: float | None = None
    min_next_bid: float
    max_next_bid: float | None = None
    min_bid_increment: float
    max_bid_increment: float | None = None
    auction_start_date: datetime | None = None
    auction_end_date: datetime | None = None
    auction_status: str | None = None
    total_bids: int
    time_remaining_seconds: float
    is_seller: bool = False
    is_highest_bidder: bool = False
    winning_bid_amount: float | None = None


class AdminAuctionOverview(BaseModel):
    property_id: uuid.UUID
    title: str
    property_code: str | None = None
    property_image: str | None = None
    seller_name: str | None = None
    seller_email: str | None = None
    reserve_price: float | None = None
    current_highest_bid: float | None = None
    highest_bidder_id: uuid.UUID | None = None
    highest_bidder_name: str | None = None
    highest_bidder_email: str | None = None
    highest_bidder_phone: str | None = None
    auction_start_date: datetime | None = None
    auction_end_date: datetime | None = None
    auction_status: str | None = None
    total_bids: int
    time_remaining_seconds: float
    bids: list[AdminBidResponse] = []


class UpdateReservePriceRequest(BaseModel):
    reserve_price: float = Field(..., gt=0, description="New lowest acceptable price")
    extend_days: int | None = Field(default=7, ge=1, le=60, description="Optional days to re-open bidding")


class AdminDecisionRequest(BaseModel):
    status: str = Field(..., description="Target status: accepted, rejected, offline_completed, cancelled")
    notes: str | None = None
