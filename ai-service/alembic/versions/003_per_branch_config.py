"""Per-branch model + train config

Revision ID: 003
Revises: 002
Create Date: 2026-04-17

Thay đổi:
  1. Tạo bảng ai_train_config — lưu config train per-branch
  2. Thêm cột branch_id vào model_registry
  3. Thêm cột mape vào model_registry
  4. Thêm cột branch_id vào train_logs
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. Bảng ai_train_config — config train per-branch
    # ------------------------------------------------------------------ #
    op.create_table(
        "ai_train_config",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),

        # Multi-tenant: mọi query phải filter theo tenant_id
        sa.Column("tenant_id", sa.String(36), nullable=False),
        sa.Column("branch_id", sa.String(36), nullable=False),

        # Lấy data từ ngày nào — null = lấy tất cả từ đơn đầu tiên
        sa.Column("start_date", sa.Date(), nullable=True),

        # Hyperparameters NeuralProphet — có default để fallback khi chưa config
        # n_lags KHÔNG lưu ở đây — tự tính từ active_days trong train_service
        sa.Column("n_forecasts",        sa.Integer(), nullable=False, server_default="7"),
        sa.Column("epochs",             sa.Integer(), nullable=False, server_default="100"),
        sa.Column("weekly_seasonality", sa.Boolean(), nullable=False, server_default="true"),

        # Thời điểm cập nhật gần nhất
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),

        # Mỗi branch chỉ có 1 config
        sa.UniqueConstraint("tenant_id", "branch_id", name="uq_train_config_tenant_branch"),
    )
    op.create_index("idx_train_config_tenant",        "ai_train_config", ["tenant_id"])
    op.create_index("idx_train_config_tenant_branch", "ai_train_config", ["tenant_id", "branch_id"])

    # ------------------------------------------------------------------ #
    # 2. model_registry — thêm branch_id và mape
    # ------------------------------------------------------------------ #
    # branch_id nullable để backward compat với record global model cũ
    op.add_column(
        "model_registry",
        sa.Column("branch_id", sa.String(36), nullable=True),
    )
    op.add_column(
        "model_registry",
        sa.Column("mape", sa.Float(), nullable=True),
    )
    op.create_index("idx_model_registry_branch", "model_registry", ["branch_id"])
    op.create_index(
        "idx_model_registry_tenant_branch",
        "model_registry",
        ["tenant_id", "branch_id"],
    )

    # ------------------------------------------------------------------ #
    # 3. train_logs — thêm branch_id để biết log thuộc branch nào
    # ------------------------------------------------------------------ #
    op.add_column(
        "train_logs",
        sa.Column("branch_id", sa.String(36), nullable=True),
    )
    op.create_index("idx_train_logs_branch",        "train_logs", ["branch_id"])
    op.create_index("idx_train_logs_tenant_branch", "train_logs", ["tenant_id", "branch_id"])


def downgrade() -> None:
    # train_logs
    op.drop_index("idx_train_logs_tenant_branch", table_name="train_logs")
    op.drop_index("idx_train_logs_branch",        table_name="train_logs")
    op.drop_column("train_logs", "branch_id")

    # model_registry
    op.drop_index("idx_model_registry_tenant_branch", table_name="model_registry")
    op.drop_index("idx_model_registry_branch",        table_name="model_registry")
    op.drop_column("model_registry", "mape")
    op.drop_column("model_registry", "branch_id")

    # ai_train_config
    op.drop_index("idx_train_config_tenant_branch", table_name="ai_train_config")
    op.drop_index("idx_train_config_tenant",        table_name="ai_train_config")
    op.drop_table("ai_train_config")
