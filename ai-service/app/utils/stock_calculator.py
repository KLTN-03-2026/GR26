"""
Stock Calculator — tính ngày hết hàng và số lượng gợi ý nhập.

Đây là pure logic (không DB, không ML):
- Chỉ import datetime + pandas
- Không có side effect — dễ test, dễ tái sử dụng
"""

from datetime import date, timedelta
from typing import Any

import pandas as pd

# Safety buffer mặc định — nhập thêm 20% so với dự báo để phòng sai số
DEFAULT_SAFETY_FACTOR = 1.2

# Số ngày đặt hàng trước khi hết hàng (lead time mặc định)
DEFAULT_LEAD_TIME_DAYS = 2

# Ngày đặt hàng mặc định khi không xác định được ngày hết hàng
DEFAULT_ORDER_HORIZON_DAYS = 30



def predict_stockout_date(
    current_stock: float,
    forecast_df: pd.DataFrame,
) -> date | None:
    """
    Tính ngày hết hàng dự kiến dựa trên tồn kho hiện tại và dự báo tiêu thụ.

    Tích lũy tiêu thụ từng ngày (yhat1) đến khi vượt current_stock.
    Giá trị yhat1 âm được clip về 0 trước khi tính.

    Args:
        current_stock: Số lượng tồn kho hiện tại (theo đơn vị nguyên liệu).
                       Nếu <= 0 → coi như đã hết hàng, trả về hôm nay.
        forecast_df: DataFrame từ NeuralProphet với cột 'ds' (datetime)
                     và 'yhat1' (float). Có thể rỗng.

    Returns:
        Ngày dự kiến hết hàng, hoặc None nếu tồn kho đủ trong toàn kỳ dự báo.
    """
    # Đã hết hàng rồi — trả về hôm nay ngay
    if current_stock <= 0:
        return date.today()

    # Không có dự báo → không thể tính ngày hết hàng
    if forecast_df.empty:
        return None

    # Tích lũy tiêu thụ từng ngày cho đến khi vượt tồn kho hiện tại
    cumulative = 0.0
    for _, row in forecast_df.iterrows():
        # Guard NaN/NaT — không để float() crash trên giá trị không hợp lệ
        raw: Any = row["yhat1"]
        daily = max(float(raw) if pd.notna(raw) else 0.0, 0.0)
        cumulative += daily
        if cumulative >= current_stock:
            return row["ds"].date()

    return None  # Tồn kho đủ dùng trong toàn kỳ dự báo


def calc_suggested_qty(
    forecast_df: pd.DataFrame,
    safety_factor: float = DEFAULT_SAFETY_FACTOR,
) -> float:
    """
    Tính số lượng gợi ý nhập dựa trên tổng tiêu thụ dự báo + safety buffer.

    Công thức: round(sum(max(yhat1, 0)) × safety_factor, 2)

    Args:
        forecast_df: DataFrame với cột 'yhat1'.
                     Nếu rỗng → trả về 0.0.
        safety_factor: Hệ số an toàn (mặc định 1.2 = nhập thêm 20%).

    Returns:
        Số lượng gợi ý nhập, làm tròn 2 chữ số thập phân.
    """
    if forecast_df.empty:
        return 0.0

    total_forecast = sum(
        max(float(row["yhat1"]) if pd.notna(row["yhat1"]) else 0.0, 0.0)
        for _, row in forecast_df.iterrows()
    )
    return round(total_forecast * safety_factor, 2)


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
                       Nếu None → tồn kho đủ, đặt hàng sau 30 ngày.
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
