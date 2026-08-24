"""optimize_indexes

Revision ID: 007_optimize_indexes
Revises: 77dd6d257ab4
Create Date: 2026-08-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '007_optimize_indexes'
down_revision: Union[str, None] = '77dd6d257ab4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safely create indexes to optimize queries
    op.execute('CREATE INDEX IF NOT EXISTS ix_properties_created_at ON properties (created_at)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_properties_status ON properties (status)')


def downgrade() -> None:
    op.drop_index('ix_properties_created_at', table_name='properties')
    op.drop_index('ix_properties_status', table_name='properties')
