"""
Pydantic schemas cho forecast API.
"""

from datetime import date, datetime

from pydantic import BaseModel


class DayForecast(BaseModel):
    """Dự báo tiêu thụ cho 1 ngày cụ thể."""

    forecast_date: date
    predicted_qty: float  # Tiêu thụ dự kiến theo đơn vị nguyên liệu


class IngredientForecast(BaseModel):
    """Dự báo cho 1 nguyên liệu trong 7 ngày tới."""

    ingredient_id: str
    ingredient_name: str
    unit: str
    forecast_days: list[DayForecast]
    stockout_date: date | None       # Ngày dự kiến hết hàng (None = đủ dùng)
    suggested_order_qty: float       # Số lượng gợi ý nhập
    suggested_order_date: date       # Ngày nên đặt hàng (thường = hôm nay)


class ForecastResponse(BaseModel):
    """Response cho GET /api/v1/forecast/{branch_id}."""

    branch_id: str
    branch_name: str
    generated_at: datetime           # Thời điểm predict job chạy
    ingredients: list[IngredientForecast]
