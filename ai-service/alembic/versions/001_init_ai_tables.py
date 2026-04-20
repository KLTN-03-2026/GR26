"""Init AI tables — single clean migration

Revision ID: 001
Revises:
Create Date: 2026-04-15

Tạo toàn bộ schema AI Service:
  1. ai_series_registry    — ánh xạ (ingredient × branch) → integer series_id
  2. consumption_history   — lịch sử tiêu thụ (dùng để train)
  3. forecast_results      — kết quả dự báo (BE đọc)
  4. model_registry        — track model đã train
  5. train_logs            — log quá trình train
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Xoá bảng cũ nếu còn sót từ migration trước — safe check
    op.execute("DROP TABLE IF EXISTS forecast_results CASCADE")
    op.execute("DROP TABLE IF EXISTS train_logs CASCADE")
    op.execute("DROP TABLE IF EXISTS consumption_history CASCADE")
    op.execute("DROP TABLE IF EXISTS model_registry CASCADE")
    op.execute("DROP TABLE IF EXISTS ai_series_registry CASCADE")

    # ------------------------------------------------------------------ #
    # 1. ai_series_registry — phải tạo TRƯỚC (các bảng sau FK vào đây)
    # ------------------------------------------------------------------ #
    op.create_table(
        "ai_series_registry",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("ingredient_id", UUID(as_uuid=False), nullable=False),
        sa.Column("branch_id",     UUID(as_uuid=False), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.UniqueConstraint("ingredient_id", "branch_id", name="uq_series_ing_branch"),
    )
    op.create_index("idx_series_ingredient", "ai_series_registry", ["ingredient_id"])
    op.create_index("idx_series_branch",     "ai_series_registry", ["branch_id"])

    # ------------------------------------------------------------------ #
    # 2. consumption_history
    # ------------------------------------------------------------------ #
    op.create_table(
        "consumption_history",
        sa.Column("id",        sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("series_id", sa.Integer(),
                  sa.ForeignKey("ai_series_registry.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("ds", sa.Date(), nullable=False),
        sa.Column("y",  sa.Float(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.UniqueConstraint("series_id", "ds", name="uq_consumption_series_date"),
    )
    op.create_index("idx_consumption_series", "consumption_history", ["series_id"])

    # ------------------------------------------------------------------ #
    # 3. forecast_results
    # ------------------------------------------------------------------ #
    op.create_table(
        "forecast_results",
        sa.Column("id",        sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("series_id", sa.Integer(),
                  sa.ForeignKey("ai_series_registry.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("forecast_date",  sa.Date(),  nullable=False),
        sa.Column("predicted_qty",  sa.Float(), nullable=False),
        sa.Column("stockout_date",  sa.Date(),  nullable=True),
        sa.Column("suggested_qty",  sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.UniqueConstraint("series_id", "forecast_date", name="uq_forecast_series_date"),
    )
    op.create_index("idx_forecast_series", "forecast_results", ["series_id"])
    op.create_index(
        "idx_forecast_series_date",
        "forecast_results",
        ["series_id", "forecast_date"],
    )

    # ------------------------------------------------------------------ #
    # 4. model_registry
    # ------------------------------------------------------------------ #
    op.create_table(
        "model_registry",
        sa.Column("id",           sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("tenant_id",    sa.String(36), nullable=False),
        sa.Column("model_path",   sa.String(500), nullable=False),
        sa.Column("trained_at",   sa.DateTime(timezone=True), nullable=False),
        sa.Column("series_count", sa.Integer(),  nullable=True),
        sa.Column("mae",          sa.Float(),    nullable=True),
        sa.Column("is_active",    sa.Boolean(),  nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )
    op.create_index("idx_model_registry_tenant", "model_registry", ["tenant_id"])

    # ------------------------------------------------------------------ #
    # 5. train_logs
    # ------------------------------------------------------------------ #
    op.create_table(
        "train_logs",
        sa.Column("id",            sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("tenant_id",     sa.String(36), nullable=False),
        sa.Column("started_at",    sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at",   sa.DateTime(timezone=True), nullable=True),
        sa.Column("status",        sa.String(20), nullable=False, server_default="running"),
        sa.Column("series_count",  sa.Integer(), nullable=True),
        sa.Column("mae",           sa.Float(),   nullable=True),
        sa.Column("error_message", sa.Text(),    nullable=True),
        sa.Column("trigger_type",  sa.String(20), nullable=False, server_default="scheduled"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )
    op.create_index("idx_train_logs_tenant", "train_logs", ["tenant_id"])


def downgrade() -> None:
    op.drop_table("train_logs")
    op.drop_table("model_registry")
    op.drop_table("forecast_results")
    op.drop_table("consumption_history")
    op.drop_table("ai_series_registry")
