"""make time_slot_id nullable

Revision ID: e897f629d45f
Revises: 77dd6d257ab4
Create Date: 2026-08-17 23:15:29.627623

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e897f629d45f'
down_revision: Union[str, None] = '77dd6d257ab4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('appointments', 'time_slot_id', existing_type=sa.UUID(), nullable=True)


def downgrade() -> None:
    op.alter_column('appointments', 'time_slot_id', existing_type=sa.UUID(), nullable=False)
