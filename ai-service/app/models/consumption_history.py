"""
ConsumptionHistory — lịch sử tiêu thụ nguyên liệu theo ngày.

Dùng để:
- Lưu snapshot consumption data từ inventory_transactions của BE
- Phục vụ train NeuralProphet (thay vì query BE mỗi lần train)
- UNIQUE(series_id, ds) — 1 ngày chỉ có 1 giá trị tiêu thụ mỗi series
"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ConsumptionHistory(Base):
    """Lịch sử tiêu thụ nguyên liệu theo ngày — nguồn dữ liệu để train model."""

    __tablename__ = "consumption_history"
    __table_args__ = (
        UniqueConstraint("series_id", "ds", name="uq_consumption_series_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # FK tới ai_series_registry
    series_id: Mapped[int] = mapped_column(
        ForeignKey("ai_series_registry.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Ngày tiêu thụ
    ds: Mapped[date] = mapped_column(Date, nullable=False)

    # Lượng tiêu thụ trong ngày (đơn vị theo ingredient.unit)
    y: Mapped[float] = mapped_column(Float, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationship ngược lại để debug/inspect
    series: Mapped["AiSeriesRegistry"] = relationship(  # type: ignore[name-defined]
        "AiSeriesRegistry", lazy="noload"
    )
