"""Bid ORM model for real-time dynamic property bidding."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Bid(Base):
    __tablename__ = "bids"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    bidder_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        SAEnum(
            "active", "outbid", "winning", "accepted", "rejected",
            name="bid_status_enum",
        ),
        nullable=False,
        default="active",
        index=True,
    )
    is_outbid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    property: Mapped["Property"] = relationship("Property", back_populates="bids", lazy="selectin")
    bidder: Mapped["User"] = relationship("User", foreign_keys=[bidder_id], lazy="selectin")
