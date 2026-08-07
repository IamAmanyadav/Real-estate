"""Add appointment scheduling system.

Revision ID: 004_appointment_system
Revises: 05d027dac8c3
Create Date: 2026-07-26
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "004_appointment_system"
down_revision = "05d027dac8c3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── appointment_status_enum ──────────────────────────────────────────
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE appointment_status_enum AS ENUM (
                'pending', 'approved', 'cancelled', 'completed', 'rescheduled'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    # ── time_slots table ─────────────────────────────────────────────────
    op.create_table(
        "time_slots",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("property_id", sa.Uuid(), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("seller_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("slot_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("is_booked", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_time_slots_property_id", "time_slots", ["property_id"])
    op.create_index("ix_time_slots_seller_id", "time_slots", ["seller_id"])
    op.create_index("ix_time_slots_slot_date", "time_slots", ["slot_date"])
    op.create_index("ix_time_slots_is_booked", "time_slots", ["is_booked"])

    # ── appointments table ───────────────────────────────────────────────
    appointment_enum = sa.dialects.postgresql.ENUM(
        "pending", "approved", "cancelled", "completed", "rescheduled",
        name="appointment_status_enum",
        create_type=False,
    )
    op.create_table(
        "appointments",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("property_id", sa.Uuid(), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("buyer_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("seller_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("time_slot_id", sa.Uuid(), sa.ForeignKey("time_slots.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", appointment_enum, server_default="pending", nullable=False),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_appointments_property_id", "appointments", ["property_id"])
    op.create_index("ix_appointments_buyer_id", "appointments", ["buyer_id"])
    op.create_index("ix_appointments_seller_id", "appointments", ["seller_id"])
    op.create_index("ix_appointments_time_slot_id", "appointments", ["time_slot_id"])
    op.create_index("ix_appointments_status", "appointments", ["status"])


def downgrade() -> None:
    op.drop_table("appointments")
    op.drop_table("time_slots")
    sa.Enum(name="appointment_status_enum").drop(op.get_bind(), checkfirst=True)
