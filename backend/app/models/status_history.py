"""PropertyStatusHistory ORM model for tracking verification status changes."""

from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PropertyStatusHistory(Base):
    __tablename__ = "property_status_history"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    old_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    changed_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    property: Mapped["Property"] = relationship(
        "Property", back_populates="status_history",
    )
    changed_by_user: Mapped["User"] = relationship("User", lazy="selectin")
