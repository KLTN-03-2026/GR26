"""
Stock Calculator — tính ngày hết hàng và số lượng gợi ý nhập.

Đây là pure logic (không DB, không ML):
- Chỉ import datetime + pandas
- Không có side effect — dễ test, dễ tái sử dụng
"""

from collections.abc import Iterable
from datetime import date, datetime, timedelta
from math import ceil
from typing import Any

import pandas as pd

# Safety buffer mặc định — nhập thêm 20% so với dự báo để phòng sai số
DEFAULT_SAFETY_FACTOR = 1.2

# Số ngày đặt hàng trước khi hết hàng (lead time mặc định)
DEFAULT_LEAD_TIME_DAYS = 2

# Ngày đặt hàng mặc định khi không xác định được ngày hết hàng
DEFAULT_ORDER_HORIZON_DAYS = 30

# Số ngày tối đa được ước tính tiếp sau forecast window.
# Tránh trả về ngày hết hàng rất xa khi tồn kho quá lớn so với nhu cầu dự báo.
DEFAULT_STOCKOUT_EXTRAPOLATION_DAYS = 30


def _to_date(value: Any) -> date | None:
    if pd.isna(value):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if hasattr(value, "date"):
        return value.date()
    return None


def _to_daily_qty(value: Any) -> float:
    if pd.isna(value):
        return 0.0
    return max(float(value), 0.0)


def predict_stockout_date_from_forecasts(
    current_stock: float,
    daily_forecasts: Iterable[tuple[Any, Any]],
    max_extrapolation_days: int | None = DEFAULT_STOCKOUT_EXTRAPOLATION_DAYS,
) -> date | None:
    """
    Tính ngày hết hàng từ chuỗi dự báo ngày/số lượng.

    Nếu tồn kho chưa hết trong forecast window, hàm ước tính tiếp bằng mức tiêu
    thụ trung bình của window hiện tại. Trả về None nếu không có tiêu thụ hoặc
    ngày hết hàng vượt quá max_extrapolation_days sau forecast window.
    """
    if current_stock <= 0:
        return date.today()

    rows = []
    for raw_date, raw_qty in daily_forecasts:
        forecast_date = _to_date(raw_date)
        if forecast_date is None:
            continue
        rows.append((forecast_date, _to_daily_qty(raw_qty)))

    if not rows:
        return None

    rows.sort(key=lambda item: item[0])

    cumulative = 0.0
    for forecast_date, daily in rows:
        cumulative += daily
        if cumulative >= current_stock:
            return forecast_date

    avg_daily = cumulative / len(rows)
    if avg_daily <= 0:
        return None

    remaining_after_window = current_stock - cumulative
    days_after_window = ceil(remaining_after_window / avg_daily)
    if (
        max_extrapolation_days is not None
        and days_after_window > max_extrapolation_days
    ):
        return None

    return rows[-1][0] + timedelta(days=days_after_window)


def predict_stockout_date(
    current_stock: float,
    forecast_df: pd.DataFrame,
    max_extrapolation_days: int | None = DEFAULT_STOCKOUT_EXTRAPOLATION_DAYS,
) -> date | None:
    """
    Tính ngày hết hàng dự kiến dựa trên tồn kho hiện tại và dự báo tiêu thụ.

    Tích lũy tiêu thụ từng ngày (yhat1) đến khi vượt current_stock.
    Giá trị yhat1 âm được clip về 0 trước khi tính.
    Nếu chưa hết trong forecast window, ước tính tiếp bằng tiêu thụ trung bình.

    Args:
        current_stock: Số lượng tồn kho hiện tại (theo đơn vị nguyên liệu).
                       Nếu <= 0 → coi như đã hết hàng, trả về hôm nay.
        forecast_df: DataFrame từ NeuralProphet với cột 'ds' (datetime)
                     và 'yhat1' (float). Có thể rỗng.
        max_extrapolation_days: Số ngày tối đa ước tính tiếp sau forecast window.
                                None = không giới hạn.

    Returns:
        Ngày dự kiến hết hàng, hoặc None nếu không thể ước tính trong horizon.
    """
    if current_stock <= 0:
        return date.today()

    if forecast_df.empty:
        return None

    return predict_stockout_date_from_forecasts(
        current_stock,
        ((row["ds"], row["yhat1"]) for _, row in forecast_df.iterrows()),
        max_extrapolation_days=max_extrapolation_days,
    )


def calc_suggested_qty(
    forecast_df: pd.DataFrame,
    safety_factor: float = DEFAULT_SAFETY_FACTOR,
    current_stock: float = 0.0,
) -> float:
    """
    Tính số lượng gợi ý nhập dựa trên tổng tiêu thụ dự báo + safety buffer.

    Công thức: round(max(sum(max(yhat1, 0)) × safety_factor − current_stock, 0), 2)

    Args:
        forecast_df: DataFrame với cột 'yhat1'.
                     Nếu rỗng → trả về 0.0.
        safety_factor: Hệ số an toàn (mặc định 1.2 = nhập thêm 20%).
        current_stock: Tồn kho hiện tại. Mặc định 0 để giữ tương thích với
                       cách tính chỉ dựa trên forecast.

    Returns:
        Số lượng gợi ý nhập, làm tròn 2 chữ số thập phân.
    """
    if forecast_df.empty:
        return 0.0

    total_forecast = sum(
        max(float(row["yhat1"]) if pd.notna(row["yhat1"]) else 0.0, 0.0)
        for _, row in forecast_df.iterrows()
    )
    return round(max(total_forecast * safety_factor - max(current_stock, 0.0), 0.0), 2)


def calc_suggested_order_date(
    stockout_date: date | None,
    lead_time_days: int = DEFAULT_LEAD_TIME_DAYS,
) -> date:
    """
    Tính ngày nên đặt hàng dựa trên ngày dự kiến hết hàng và lead time.

    Công thức: stockout_date − lead_time_days
    Nếu kết quả rơi vào quá khứ → trả về hôm nay (đặt hàng ngay).

    Args:
        stockout_date: Ngày dự kiến hết hàng (từ predict_stockout_date).
                       Nếu None → không ước tính được trong horizon, đặt hàng
                       theo lịch định kỳ sau 30 ngày.
        lead_time_days: Số ngày cần để nhà cung cấp giao hàng (mặc định 2).

    Returns:
        Ngày nên đặt hàng — không bao giờ là ngày trong quá khứ.
    """
    today = date.today()

    if stockout_date is None:
        # Tồn kho đủ dùng — đặt hàng theo lịch định kỳ
        return today + timedelta(days=DEFAULT_ORDER_HORIZON_DAYS)

    suggested = stockout_date - timedelta(days=lead_time_days)

    # Không để trả ngày quá khứ — nếu đã trễ thì đặt hàng ngay hôm nay
    return max(suggested, today)


def get_urgency(stockout_date: date | None) -> str:
    """
    Đánh giá mức độ khẩn cấp dựa trên ngày dự kiến hết hàng.

    Thang đo:
    - "critical" : hết hàng trong <= 2 ngày (hoặc đã hết)
    - "warning"  : hết hàng trong <= 5 ngày
    - "ok"       : còn đủ hàng hoặc không xác định được ngày hết

    Args:
        stockout_date: Ngày dự kiến hết hàng. None = tồn kho đủ trong kỳ dự báo.

    Returns:
        Một trong các giá trị: "critical", "warning", "ok"
    """
    if stockout_date is None:
        return "ok"

    # days_until < 0 → đã hết hàng (quá hạn) → critical
    days_until = (stockout_date - date.today()).days

    if days_until <= 2:
        return "critical"
    if days_until <= 5:
        return "warning"
    return "ok"
