"""TimeSlot and Appointment ORM models for property visit scheduling."""

from __future__ import annotations

import uuid

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TimeSlot(Base):
    __tablename__ = "time_slots"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    slot_date: Mapped[str] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[str] = mapped_column(Time, nullable=False)
    end_time: Mapped[str] = mapped_column(Time, nullable=False)
    is_booked: Mapped[bool] = mapped_column(default=False, index=True)

    # Relationships
    property: Mapped["Property"] = relationship("Property", lazy="selectin")
    seller: Mapped["User"] = relationship("User", lazy="selectin")


class Appointment(Base):
    __tablename__ = "appointments"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    buyer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    time_slot_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("time_slots.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    status: Mapped[str] = mapped_column(
        SAEnum(
            "pending", "approved", "cancelled", "completed", "rescheduled",
            name="appointment_status_enum",
        ),
        nullable=False,
        default="pending",
        index=True,
    )
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    property: Mapped["Property"] = relationship("Property", lazy="selectin")
    buyer: Mapped["User"] = relationship(
        "User", lazy="selectin", foreign_keys=[buyer_id],
    )
    seller: Mapped["User"] = relationship(
        "User", lazy="selectin", foreign_keys=[seller_id],
    )
    time_slot: Mapped["TimeSlot"] = relationship("TimeSlot", lazy="selectin")
