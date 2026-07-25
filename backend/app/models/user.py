"""User ORM model for admin, seller, and buyer accounts."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(200), unique=True, nullable=False, index=True,
    )
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    role: Mapped[str] = mapped_column(
        SAEnum("admin", "seller", "buyer", name="user_role_enum"),
        nullable=False,
        default="buyer",
        index=True,
    )
    status: Mapped[str] = mapped_column(
        SAEnum(
            "active", "suspended", "pending_verification", "rejected",
            name="user_status_enum",
        ),
        nullable=False,
        default="pending_verification",
        index=True,
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships — seller's properties
    properties: Mapped[list["Property"]] = relationship(
        "Property",
        back_populates="seller",
        foreign_keys="Property.seller_id",
        lazy="selectin",
    )
