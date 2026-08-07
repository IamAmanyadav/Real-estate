"""Add property_code column to properties table.

Revision ID: 005_add_property_code
Revises: 004_appointment_system
Create Date: 2026-08-04
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "005_add_property_code"
down_revision = "004_appointment_system"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add nullable column
    op.add_column(
        "properties",
        sa.Column("property_code", sa.String(20), nullable=True),
    )

    # 2. Backfill existing rows with sequential codes based on created_at order
    conn = op.get_bind()
    rows = conn.execute(
        sa.text(
            "SELECT id FROM properties ORDER BY created_at ASC"
        )
    ).fetchall()
    for i, row in enumerate(rows, start=1):
        conn.execute(
            sa.text(
                "UPDATE properties SET property_code = :code WHERE id = :id"
            ),
            {"code": f"LXE-{i:04d}", "id": row[0]},
        )

    # 3. Add unique index
    op.create_unique_constraint(
        "uq_properties_property_code", "properties", ["property_code"]
    )
    op.create_index(
        "ix_properties_property_code", "properties", ["property_code"]
    )


def downgrade() -> None:
    op.drop_index("ix_properties_property_code", table_name="properties")
    op.drop_constraint("uq_properties_property_code", "properties", type_="unique")
    op.drop_column("properties", "property_code")
