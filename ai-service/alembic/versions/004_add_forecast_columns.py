"""Add urgency, suggested_order_date, is_fallback to forecast_results

Revision ID: 004
Revises: 003
Create Date: 2026-04-23

Thêm các cột còn thiếu vào forecast_results để BE Spring Boot đọc được:
  - urgency            : mức độ cấp bách (ok / warning / critical)
  - suggested_order_date: ngày nên đặt hàng
  - is_fallback        : true nếu dùng fallback prediction (model chưa train đủ data)
"""

import sqlalchemy as sa
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "forecast_results",
        sa.Column("urgency", sa.String(20), nullable=True),
    )
    op.add_column(
        "forecast_results",
        sa.Column("suggested_order_date", sa.Date(), nullable=True),
    )
    op.add_column(
        "forecast_results",
        sa.Column("is_fallback", sa.Boolean(), nullable=True, server_default="false"),
    )
    op.create_index("idx_forecast_urgency", "forecast_results", ["urgency"])


def downgrade() -> None:
    op.drop_index("idx_forecast_urgency", table_name="forecast_results")
    op.drop_column("forecast_results", "is_fallback")
    op.drop_column("forecast_results", "suggested_order_date")
    op.drop_column("forecast_results", "urgency")
