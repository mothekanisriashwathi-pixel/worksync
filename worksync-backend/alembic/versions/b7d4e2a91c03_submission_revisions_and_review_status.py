"""submission revisions, links and IN_REVIEW status

Revision ID: b7d4e2a91c03
Revises: 081b27e65b2f
Create Date: 2026-10-14 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7d4e2a91c03'
down_revision: Union[str, None] = '081b27e65b2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OLD_STATUS = sa.Enum('PENDING', 'APPROVED', 'CHANGES_REQUESTED', name='submissionstatus')
NEW_STATUS = sa.Enum('PENDING', 'IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', name='submissionstatus')


def upgrade() -> None:
    with op.batch_alter_table('submissions') as batch:
        batch.add_column(sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
        batch.add_column(sa.Column('original_filename', sa.String(length=255), nullable=True))
        batch.add_column(sa.Column('github_url', sa.String(length=500), nullable=True))
        batch.alter_column('file_path', existing_type=sa.String(length=500), nullable=True)
        batch.alter_column('status', existing_type=OLD_STATUS, type_=NEW_STATUS, existing_nullable=False)

    # Number existing submissions per task (oldest = 1) so the unique constraint holds.
    conn = op.get_bind()
    rows = conn.execute(sa.text('SELECT id, task_id FROM submissions ORDER BY task_id, submitted_at, id')).fetchall()
    counters: dict[int, int] = {}
    for sub_id, task_id in rows:
        counters[task_id] = counters.get(task_id, 0) + 1
        conn.execute(sa.text('UPDATE submissions SET version = :v WHERE id = :id'), {'v': counters[task_id], 'id': sub_id})

    with op.batch_alter_table('submissions') as batch:
        batch.create_unique_constraint('uq_submissions_task_version', ['task_id', 'version'])


def downgrade() -> None:
    # Rows with IN_REVIEW fall back to PENDING so the old enum stays valid.
    op.execute("UPDATE submissions SET status = 'PENDING' WHERE status = 'IN_REVIEW'")
    with op.batch_alter_table('submissions') as batch:
        batch.drop_constraint('uq_submissions_task_version', type_='unique')
        batch.alter_column('status', existing_type=NEW_STATUS, type_=OLD_STATUS, existing_nullable=False)
        batch.drop_column('github_url')
        batch.drop_column('original_filename')
        batch.drop_column('version')
    # file_path stays nullable: link-only submissions have no file to restore.
