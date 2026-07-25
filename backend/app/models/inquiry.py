"""Inquiry ORM model — extended with buyer tracking and inquiry types."""

from __future__ import annotations

import uuid

from sqlalchemy import Enum as SAEnum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Inquiry(Base):
    __tablename__ = "inquiries"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    property_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("properties.id"), nullable=True, index=True,
    )
    inquiry_status: Mapped[str] = mapped_column(
        SAEnum("new", "read", "responded", "closed", name="inquiry_status_enum"),
        nullable=False,
        default="new",
        index=True,
    )
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Buyer tracking columns ──────────────────────────────────────────
    inquiry_type: Mapped[str] = mapped_column(
        SAEnum("inquiry", "purchase_request", name="inquiry_type_enum"),
        nullable=False,
        default="inquiry",
        index=True,
    )
    buyer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    tracking_status: Mapped[str] = mapped_column(
        SAEnum(
            "submitted", "under_review", "approved", "rejected", "completed",
            name="tracking_status_enum",
        ),
        nullable=False,
        default="submitted",
        index=True,
    )
    admin_response: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    property: Mapped["Property"] = relationship(
        "Property", lazy="selectin",
    )
    buyer: Mapped["User"] = relationship(
        "User", lazy="selectin", foreign_keys=[buyer_id],
    )
