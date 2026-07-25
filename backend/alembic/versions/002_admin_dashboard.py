"""Admin dashboard — users, verification workflow, status history

Revision ID: 002_admin_dashboard
Revises: 001_initial_schema
Create Date: 2026-06-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "002_admin_dashboard"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Users table ──────────────────────────────────────────────────────
    user_role_enum = sa.Enum("admin", "seller", "buyer", name="user_role_enum")
    user_status_enum = sa.Enum(
        "active", "suspended", "pending_verification", "rejected",
        name="user_status_enum",
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("password_hash", sa.String(200), nullable=False),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("phone", sa.String(30), nullable=True),
        sa.Column("avatar", sa.String(500), nullable=True),
        sa.Column("role", user_role_enum, nullable=False, server_default="buyer"),
        sa.Column("status", user_status_enum, nullable=False, server_default="pending_verification"),
        sa.Column("is_verified", sa.Boolean(), server_default="false"),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"])
    op.create_index(op.f("ix_users_role"), "users", ["role"])
    op.create_index(op.f("ix_users_status"), "users", ["status"])

    # ── Expand property_type_enum with flat and plot ─────────────────────
    # PostgreSQL requires ALTER TYPE to add new values
    op.execute("ALTER TYPE property_type_enum ADD VALUE IF NOT EXISTS 'flat'")
    op.execute("ALTER TYPE property_type_enum ADD VALUE IF NOT EXISTS 'plot'")

    # ── Add verification columns to properties ──────────────────────────
    verification_status_enum = sa.Enum(
        "pending", "under_review", "approved", "rejected",
        "published", "sold", "archived",
        name="verification_status_enum",
    )
    verification_status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column("properties", sa.Column(
        "verification_status", verification_status_enum,
        nullable=False, server_default="published",
    ))
    op.add_column("properties", sa.Column(
        "seller_id", sa.Uuid(),
        sa.ForeignKey("users.id", ondelete="SET NULL", name="fk_properties_seller_id_users"),
        nullable=True,
    ))
    op.add_column("properties", sa.Column("rejection_reason", sa.Text(), nullable=True))
    op.add_column("properties", sa.Column(
        "verified_by", sa.Uuid(),
        sa.ForeignKey("users.id", ondelete="SET NULL", name="fk_properties_verified_by_users"),
        nullable=True,
    ))
    op.add_column("properties", sa.Column(
        "verified_at", sa.DateTime(timezone=True), nullable=True,
    ))
    op.create_index(op.f("ix_properties_verification_status"), "properties", ["verification_status"])
    op.create_index(op.f("ix_properties_seller_id"), "properties", ["seller_id"])

    # ── Add status columns to inquiries ─────────────────────────────────
    inquiry_status_enum = sa.Enum("new", "read", "responded", "closed", name="inquiry_status_enum")
    inquiry_status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column("inquiries", sa.Column(
        "inquiry_status", inquiry_status_enum,
        nullable=False, server_default="new",
    ))
    op.add_column("inquiries", sa.Column("admin_notes", sa.Text(), nullable=True))
    op.create_index(op.f("ix_inquiries_inquiry_status"), "inquiries", ["inquiry_status"])

    # ── Property Status History table ───────────────────────────────────
    op.create_table(
        "property_status_history",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("property_id", sa.Uuid(),
                  sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("old_status", sa.String(50), nullable=True),
        sa.Column("new_status", sa.String(50), nullable=False),
        sa.Column("changed_by", sa.Uuid(),
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_property_status_history")),
    )
    op.create_index(
        op.f("ix_property_status_history_property_id"),
        "property_status_history", ["property_id"],
    )
    op.create_index(
        op.f("ix_property_status_history_changed_by"),
        "property_status_history", ["changed_by"],
    )


def downgrade() -> None:
    op.drop_table("property_status_history")

    op.drop_index(op.f("ix_inquiries_inquiry_status"), table_name="inquiries")
    op.drop_column("inquiries", "admin_notes")
    op.drop_column("inquiries", "inquiry_status")

    op.drop_index(op.f("ix_properties_seller_id"), table_name="properties")
    op.drop_index(op.f("ix_properties_verification_status"), table_name="properties")
    op.drop_column("properties", "verified_at")
    op.drop_column("properties", "verified_by")
    op.drop_column("properties", "rejection_reason")
    op.drop_column("properties", "seller_id")
    op.drop_column("properties", "verification_status")

    op.drop_table("users")

    # Drop enums
    sa.Enum(name="verification_status_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="inquiry_status_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="user_role_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="user_status_enum").drop(op.get_bind(), checkfirst=True)
