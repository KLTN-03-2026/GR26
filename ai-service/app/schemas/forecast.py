"""
Pydantic schemas cho forecast API.
"""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, computed_field


class DayForecast(BaseModel):
    """Dự báo tiêu thụ cho 1 ngày cụ thể."""

    model_config = ConfigDict(from_attributes=True)

    forecast_date: date
    predicted_qty: float  # Tiêu thụ dự kiến theo đơn vị nguyên liệu


class IngredientForecast(BaseModel):
    """Dự báo cho 1 nguyên liệu trong 7 ngày tới — dùng trong API response đọc từ DB."""

    model_config = ConfigDict(from_attributes=True)

    ingredient_id: str
    ingredient_name: str
    unit: str
    current_stock: float                              # Tồn kho tại thời điểm predict
    forecast_days: list[DayForecast]                  # 7 ngày dự báo
    stockout_date: date | None                        # None = không ước tính trong horizon
    suggested_order_qty: float                        # Số lượng gợi ý nhập
    suggested_order_date: date                        # Ngày nên đặt hàng
    urgency: Literal["ok", "warning", "critical"]     # Mức độ khẩn cấp
    is_fallback: bool                                 # True = dùng average thay vì model


class ForecastResponse(BaseModel):
    """
    Response cho GET /api/v1/forecast/{branch_id}.

    Bao gồm toàn bộ dự báo 7 ngày cho từng nguyên liệu của chi nhánh,
    kèm computed counts để FE hiển thị badge cảnh báo nhanh.
    """

    model_config = ConfigDict(from_attributes=True)

    branch_id: str
    branch_name: str
    generated_at: datetime                # Thời điểm predict job chạy
    last_trained_at: datetime | None      # Từ train_metadata.json — None nếu chưa train
    ingredients: list[IngredientForecast]

    @computed_field  # type: ignore[misc]
    @property
    def urgent_count(self) -> int:
        """Số nguyên liệu cần nhập ngay (urgency = critical)."""
        return sum(1 for i in self.ingredients if i.urgency == "critical")

    @computed_field  # type: ignore[misc]
    @property
    def warning_count(self) -> int:
        """Số nguyên liệu sắp hết (urgency = warning)."""
        return sum(1 for i in self.ingredients if i.urgency == "warning")


class ForecastSummary(BaseModel):
    """
    Response nhẹ cho dashboard overview — không có forecast_days chi tiết.

    Dùng cho danh sách nhiều chi nhánh, tránh payload lớn.
    """

    model_config = ConfigDict(from_attributes=True)

    branch_id: str
    generated_at: datetime
    urgent_count: int      # Số nguyên liệu critical
    warning_count: int     # Số nguyên liệu warning
    ok_count: int          # Số nguyên liệu bình thường
    total_ingredients: int


class IngredientPrediction(BaseModel):
    """
    Kết quả dự báo cho 1 nguyên liệu — output của predict_service.predict_branch().

    Khác với IngredientForecast (dành cho API response đọc từ DB),
    IngredientPrediction là output trực tiếp sau khi chạy predict job,
    bao gồm cờ is_fallback để biết nguồn gốc dự báo.
    """

    model_config = ConfigDict(from_attributes=True)

    ingredient_id: str
    ingredient_name: str
    unit: str
    current_stock: float                              # Tồn kho tại thời điểm predict
    stockout_date: date | None                        # Ngày dự kiến hết hàng
    suggested_order_qty: float                        # Số lượng gợi ý nhập
    suggested_order_date: date                        # Ngày nên đặt hàng
    urgency: Literal["ok", "warning", "critical"]     # Mức độ khẩn cấp
    is_fallback: bool                                 # True = dùng avg thay vì model
