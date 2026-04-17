"""
ForecastResult — kết quả dự báo tiêu thụ nguyên liệu 7 ngày tới.

Ghi bởi: predict job (mỗi đêm 00:30)
Đọc bởi: BE Spring Boot (serve lên FE)

Thiết kế mới: dùng Integer PK + FK series_id thay UUID,
giúp JOIN nhanh hơn và nhất quán với AiSeriesRegistry.
"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ForecastResult(Base):
    """Kết quả dự báo tiêu thụ — ghi bởi predict job, đọc bởi BE/FE."""

    __tablename__ = "forecast_results"
    __table_args__ = (
        # Không duplicate kết quả cho cùng series × ngày
        UniqueConstraint("series_id", "forecast_date", name="uq_forecast_series_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # FK tới ai_series_registry — xác định nguyên liệu + chi nhánh
    series_id: Mapped[int] = mapped_column(
        ForeignKey("ai_series_registry.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Ngày được dự báo (không phải ngày chạy predict job)
    forecast_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Tiêu thụ dự kiến trong ngày forecast_date
    predicted_qty: Mapped[float] = mapped_column(Float, nullable=False)

    # Ngày dự kiến hết hàng — None = không ước tính trong horizon
    stockout_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Số lượng gợi ý nhập thêm (tổng dự báo × safety factor 1.2 − tồn kho)
    suggested_qty: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    series: Mapped["AiSeriesRegistry"] = relationship(  # type: ignore[name-defined]
        "AiSeriesRegistry", lazy="noload"
    )
