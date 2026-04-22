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
    min_stock: float = 0.0,
    max_extrapolation_days: int | None = None,
) -> date | None:
    """
    Tính ngày hàng xuống dưới mức tồn kho tối thiểu (min_stock).

    Thay vì tính khi nào HẾT SẠCH, tính khi nào tồn kho xuống dưới MỨC AN TOÀN.
    usable_stock = current_stock - min_stock.

    Ví dụ:
      current_stock = 10kg, min_stock = 2kg
      → usable_stock = 8kg (chỉ 8kg có thể dùng trước khi phải order)
      → Với 1kg/ngày → cần order sau 8 ngày

    Args:
        current_stock: Số lượng tồn kho hiện tại (theo đơn vị nguyên liệu).
        forecast_df: DataFrame từ NeuralProphet với cột 'ds' (datetime)
                     và 'yhat1' (float). Có thể rỗng.
        min_stock: Mức tồn kho tối thiểu an toàn (mặc định 0 = tính đến khi hết sạch).
                   Nếu current_stock <= min_stock → đã dưới mức an toàn → trả về hôm nay.
        max_extrapolation_days: Số ngày tối đa ước tính tiếp sau forecast window.
                                None = không giới hạn (mặc định).

    Returns:
        Ngày dự kiến hàng xuống dưới min_stock, hoặc None nếu không thể ước tính.
    """
    # Lượng hàng thực sự có thể dùng trước khi cần order
    usable_stock = max(current_stock - min_stock, 0.0)

    # Tồn kho đã ở dưới mức an toàn → cần order ngay hôm nay
    if usable_stock <= 0:
        return date.today()

    if forecast_df.empty:
        return None

    return predict_stockout_date_from_forecasts(
        usable_stock,
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


def calc_avg_daily_consumption(forecast_df: pd.DataFrame) -> float:
    """
    Tính mức tiêu thụ trung bình mỗi ngày từ forecast.

    Dùng để ước tính ngày hết hàng khi tồn kho vượt quá forecast window
    (stockout_date = None), giúp calc_suggested_order_date không phải
    fallback cứng về +30 ngày.

    Args:
        forecast_df: DataFrame với cột 'yhat1'. Có thể rỗng.

    Returns:
        Mức tiêu thụ trung bình mỗi ngày. 0.0 nếu forecast rỗng hoặc toàn 0.
    """
    if forecast_df.empty:
        return 0.0
    values = [
        max(float(v), 0.0)
        for v in forecast_df["yhat1"]
        if pd.notna(v)
    ]
    return sum(values) / len(values) if values else 0.0


def calc_suggested_order_date(
    stockout_date: date | None,
    lead_time_days: int = DEFAULT_LEAD_TIME_DAYS,
    avg_daily_consumption: float = 0.0,
    min_stock: float = 0.0,
    current_stock: float = 0.0,
) -> date:
    """
    Tính ngày nên đặt hàng dựa trên ngày dự kiến hết hàng và lead time.

    Nếu stockout_date không None:
      Công thức: stockout_date − lead_time_days (không trả ngày quá khứ)

    Nếu stockout_date = None (tồn kho đủ dùng vượt forecast window):
      Ước tính từ usable_stock / avg_daily_consumption khi có avg_daily_consumption > 0.
      Nếu không có đủ thông tin → đặt hàng theo lịch định kỳ sau DEFAULT_ORDER_HORIZON_DAYS.

    Args:
        stockout_date: Ngày dự kiến hết hàng (từ predict_stockout_date).
                       None = không ước tính được trong horizon.
        lead_time_days: Số ngày cần để nhà cung cấp giao hàng (mặc định 2).
        avg_daily_consumption: Mức tiêu thụ trung bình mỗi ngày từ forecast.
                               Dùng khi stockout_date = None để ước tính ngày hết.
        min_stock: Mức tồn kho tối thiểu. Dùng cùng current_stock để tính usable_stock.
        current_stock: Tồn kho hiện tại. Dùng cùng min_stock để tính usable_stock.

    Returns:
        Ngày nên đặt hàng — không bao giờ là ngày trong quá khứ.
    """
    today = date.today()

    if stockout_date is not None:
        suggested = stockout_date - timedelta(days=lead_time_days)
        # Không để trả ngày quá khứ — nếu đã trễ thì đặt hàng ngay hôm nay
        return max(suggested, today)

    # stockout_date = None → tồn kho vượt forecast window
    # Ước tính từ usable_stock / avg_daily nếu có thông tin
    if avg_daily_consumption > 0:
        usable_stock = max(current_stock - min_stock, 0.0)
        days_until_empty = int(usable_stock / avg_daily_consumption)
        estimated_stockout = today + timedelta(days=days_until_empty)
        suggested = estimated_stockout - timedelta(days=lead_time_days)
        return max(suggested, today)

    # Không đủ thông tin → đặt hàng theo lịch định kỳ (giữ behavior cũ)
    return today + timedelta(days=DEFAULT_ORDER_HORIZON_DAYS)


def get_urgency(stockout_date: date | None, n_forecasts: int = 7) -> str:
    """
    Đánh giá mức độ khẩn cấp dựa trên ngày dự kiến hết hàng.

    Ngưỡng warning gắn với n_forecasts (forecast window của branch):
    - "critical" : hết hàng trong <= 2 ngày (hoặc đã hết)
    - "warning"  : hết hàng trong <= n_forecasts ngày (trong forecast window)
    - "ok"       : còn đủ hàng hoặc không xác định được ngày hết

    Args:
        stockout_date: Ngày dự kiến hết hàng. None = tồn kho đủ trong kỳ dự báo.
        n_forecasts: Số ngày forecast của branch — đọc từ ai_train_config.n_forecasts.
                     Mặc định 7 để tương thích khi không truyền vào.

    Returns:
        Một trong các giá trị: "critical", "warning", "ok"
    """
    if stockout_date is None:
        return "ok"

    # days_until < 0 → đã hết hàng (quá hạn) → critical
    days_until = (stockout_date - date.today()).days

    if days_until <= 2:
        return "critical"
    if days_until <= n_forecasts:
        # warning = hết trong forecast window → cần order trong kỳ dự báo này
        return "warning"
    return "ok"
