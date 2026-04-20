"""
ModelRegistry — track các model đã train theo tenant.

Mỗi lần train thành công ghi 1 record mới và set is_active=True,
đồng thời set is_active=False cho record cũ của cùng tenant.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ModelRegistry(Base):
    """Lưu thông tin các model NeuralProphet đã train — track active model."""

    __tablename__ = "model_registry"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # UUID tenant từ BE — string, không FK ngoại
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    # branch_id — nullable để backward compat với global model cũ (trước migration 003)
    branch_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)

    # Đường dẫn file .np trong storage/models/
    model_path: Mapped[str] = mapped_column(String(500), nullable=False)

    trained_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # Số series đã train trong lần này (số ingredient của branch)
    series_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # MAE (kỹ thuật) và MAPE (%) — MAPE dễ giải thích hơn cho chủ quán
    mae: Mapped[float | None] = mapped_column(Float, nullable=True)
    mape: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Chỉ 1 model active mỗi (tenant, branch) tại 1 thời điểm
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
