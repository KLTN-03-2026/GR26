"""
TrainLog — log kết quả mỗi lần chạy train job.

Dùng Integer PK thay UUID — nhất quán với toàn bộ schema AI Service.
Thêm trigger_type để phân biệt train tự động và train thủ công.
"""

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TrainLog(Base):
    """Log kết quả mỗi lần chạy train job — dùng để monitor và alert."""

    __tablename__ = "train_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # UUID tenant từ BE — string, không FK ngoại
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    # branch_id — nullable để backward compat; mỗi lần train 1 branch ghi 1 log riêng
    branch_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # running | success | failed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="running")

    # Số series đã train
    series_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # MAE cuối cùng của epoch train
    mae: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Stack trace hoặc mô tả lỗi nếu status=failed
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # scheduled = cron tự động | manual = Owner bấm tay
    trigger_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="scheduled"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
