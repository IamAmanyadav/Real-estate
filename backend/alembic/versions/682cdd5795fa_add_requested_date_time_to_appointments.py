"""Add requested date/time to appointments

Revision ID: 682cdd5795fa
Revises: 007_optimize_indexes
Create Date: 2026-09-02 19:34:47.950580

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '682cdd5795fa'
down_revision: Union[str, None] = '007_optimize_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('appointments', sa.Column('requested_date', sa.Date(), nullable=True))
    op.add_column('appointments', sa.Column('requested_time', sa.Time(), nullable=True))
    op.add_column('appointments', sa.Column('seller_notes', sa.Text(), nullable=True))
    op.alter_column('appointments', 'time_slot_id', existing_type=sa.UUID(), nullable=True)


def downgrade() -> None:
    op.alter_column('appointments', 'time_slot_id', existing_type=sa.UUID(), nullable=False)
    op.drop_column('appointments', 'seller_notes')
    op.drop_column('appointments', 'requested_time')
    op.drop_column('appointments', 'requested_date')
