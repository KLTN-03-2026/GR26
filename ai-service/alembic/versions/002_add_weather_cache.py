"""Add weather_cache table

Revision ID: 002
Revises: 001
Create Date: 2026-04-15

Tạo bảng cache thời tiết — lưu kết quả từ Open-Meteo API.
Tránh gọi API nhiều lần trong ngày cho cùng chi nhánh.
"""

import sqlalchemy as sa
from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "weather_cache",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        # branch_id là UUID dạng string (không có FK ngoại — cross-schema)
        sa.Column("branch_id", sa.String, nullable=False),
        sa.Column("date", sa.Date, nullable=False),
        # Nhiệt độ tối đa trong ngày (°C)
        sa.Column("temperature", sa.Float, nullable=True),
        # Tổng lượng mưa trong ngày (mm)
        sa.Column("precipitation", sa.Float, nullable=True),
        sa.Column(
            "cached_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("branch_id", "date", name="uq_weather_branch_date"),
    )
    # Index để query nhanh theo branch_id
    op.create_index("ix_weather_cache_branch_id", "weather_cache", ["branch_id"])


def downgrade() -> None:
    op.drop_index("ix_weather_cache_branch_id", table_name="weather_cache")
    op.drop_table("weather_cache")
