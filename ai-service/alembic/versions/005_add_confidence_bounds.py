"""Add lower_bound and upper_bound to forecast_results

Revision ID: 005
Revises: 004
Create Date: 2026-04-26

Thêm khoảng tin cậy 80% từ NeuralProphet quantiles=[0.1, 0.9]:
  - lower_bound : cận dưới (quantile 10%) — None với model cũ chưa train lại
  - upper_bound : cận trên (quantile 90%) — None với model cũ chưa train lại
"""

import sqlalchemy as sa
from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "forecast_results",
        sa.Column("lower_bound", sa.Float(), nullable=True),
    )
    op.add_column(
        "forecast_results",
        sa.Column("upper_bound", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("forecast_results", "upper_bound")
    op.drop_column("forecast_results", "lower_bound")
