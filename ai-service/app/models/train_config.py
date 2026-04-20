"""
TrainConfig — lưu cấu hình train NeuralProphet per-branch.

Mỗi chi nhánh có thể cài riêng:
- start_date: lấy data từ ngày nào (null = từ đơn đầu tiên)
- n_lags, n_forecasts, epochs, weekly_seasonality

yearly_seasonality KHÔNG lưu ở đây — tự động bật khi chi nhánh có ≥ 730 ngày data.
"""

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TrainConfig(Base):
    """Config train NeuralProphet cho từng chi nhánh."""

    __tablename__ = "ai_train_config"
    __table_args__ = (
        UniqueConstraint("tenant_id", "branch_id", name="uq_train_config_tenant_branch"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Multi-tenant — mọi query PHẢI filter tenant_id
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    branch_id: Mapped[str] = mapped_column(String(36), nullable=False)

    # Lấy data từ ngày nào — null = lấy tất cả từ đơn đầu tiên của branch
    start_date: Mapped[date | None] = mapped_column(Date(), nullable=True)

    # Hyperparameters — n_lags KHÔNG lưu ở đây, tự tính từ active_days
    n_forecasts: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    epochs: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    weekly_seasonality: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Metadata thời gian
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
