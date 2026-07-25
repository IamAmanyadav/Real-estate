"""PropertyDocument ORM model for ownership/verification documents."""

from __future__ import annotations

import uuid

from sqlalchemy import Enum as SAEnum, ForeignKey, String, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PropertyDocument(Base):
    __tablename__ = "property_documents"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    document_type: Mapped[str] = mapped_column(
        SAEnum(
            "title_deed", "ownership_certificate", "tax_receipt",
            "identity_proof", "noc", "encumbrance_certificate", "other",
            name="document_type_enum",
        ),
        nullable=False,
    )
    document_url: Mapped[str] = mapped_column(String(500), nullable=False)
    document_name: Mapped[str] = mapped_column(String(200), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(
        SAEnum("pending", "verified", "rejected", name="document_status_enum"),
        nullable=False,
        default="pending",
    )
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    property: Mapped["Property"] = relationship("Property", back_populates="documents")
