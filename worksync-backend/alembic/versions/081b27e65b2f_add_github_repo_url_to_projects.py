"""add_github_repo_url_to_projects

Revision ID: 081b27e65b2f
Revises: ea1e66429d16
Create Date: 2026-10-12 19:10:09.265462

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '081b27e65b2f'
down_revision: Union[str, None] = 'ea1e66429d16'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('github_repo_url', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('projects', 'github_repo_url')
