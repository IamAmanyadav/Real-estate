"""Property, PropertyImage, and PropertyFeature ORM models."""

from __future__ import annotations

import uuid

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    event,
    func,
    select,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Property(Base):
    __tablename__ = "properties"
    __table_args__ = (
        CheckConstraint("price > 0", name="positive_price"),
    )

    property_code: Mapped[str | None] = mapped_column(
        String(20), unique=True, index=True, nullable=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    zip_code: Mapped[str] = mapped_column(String(20), nullable=False)
    country: Mapped[str] = mapped_column(String(100), default="United States")
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    bedrooms: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    bathrooms: Mapped[int] = mapped_column(Integer, nullable=False)
    area: Mapped[int] = mapped_column(Integer, nullable=False)
    property_type: Mapped[str] = mapped_column(
        SAEnum(
            "house", "apartment", "condo", "townhouse", "villa", "flat", "plot",
            name="property_type_enum",
        ),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        SAEnum("for_sale", "for_rent", "sold", "pending", name="property_status_enum"),
        nullable=False,
        default="for_sale",
    )
    year_built: Mapped[int] = mapped_column(Integer, nullable=False)
    agent_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("agents.id"), nullable=False, index=True,
    )

    # ── Verification workflow columns ───────────────────────────────────
    verification_status: Mapped[str] = mapped_column(
        SAEnum(
            "pending", "under_review", "approved", "rejected",
            "published", "sold", "archived",
            name="verification_status_enum",
        ),
        nullable=False,
        default="published",
        index=True,
    )
    seller_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )
    verified_at: Mapped[str | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )

    # Relationships
    agent: Mapped["Agent"] = relationship("Agent", back_populates="properties", lazy="selectin")
    images: Mapped[list["PropertyImage"]] = relationship(
        "PropertyImage", back_populates="property", cascade="all, delete-orphan",
        lazy="selectin", order_by="PropertyImage.sort_order",
    )
    features: Mapped[list["PropertyFeature"]] = relationship(
        "PropertyFeature", back_populates="property", cascade="all, delete-orphan",
        lazy="selectin",
    )
    seller: Mapped["User"] = relationship(
        "User", back_populates="properties", foreign_keys=[seller_id], lazy="selectin",
    )
    verified_by_user: Mapped["User"] = relationship(
        "User", foreign_keys=[verified_by], lazy="selectin",
    )
    status_history: Mapped[list["PropertyStatusHistory"]] = relationship(
        "PropertyStatusHistory", back_populates="property",
        cascade="all, delete-orphan", lazy="selectin",
        order_by="PropertyStatusHistory.created_at.desc()",
    )
    documents: Mapped[list["PropertyDocument"]] = relationship(
        "PropertyDocument", back_populates="property",
        cascade="all, delete-orphan", lazy="selectin",
        order_by="PropertyDocument.sort_order",
    )


@event.listens_for(Property, "before_insert")
def _generate_property_code(mapper, connection, target):
    """Auto-generate a sequential property code like LXE-0001 before insert."""
    if target.property_code:
        return  # Already set (e.g. seed data)
    result = connection.execute(
        select(func.max(Property.property_code))
    )
    max_code = result.scalar()
    if max_code and max_code.startswith("LXE-"):
        try:
            next_num = int(max_code.split("-")[1]) + 1
        except (IndexError, ValueError):
            next_num = 1
    else:
        next_num = 1
    target.property_code = f"LXE-{next_num:04d}"


class PropertyImage(Base):
    __tablename__ = "property_images"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    property: Mapped["Property"] = relationship("Property", back_populates="images")


class PropertyFeature(Base):
    __tablename__ = "property_features"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)

    # Relationships
    property: Mapped["Property"] = relationship("Property", back_populates="features")
