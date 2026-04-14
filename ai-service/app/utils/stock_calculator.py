"""
Stock Calculator — tính ngày hết hàng và số lượng gợi ý nhập.

Đây là logic thuần Python (không DB, không ML) — dễ test.
"""

from datetime import date

import pandas as pd

from app.core.logging import get_logger

logger = get_logger(__name__)

# Safety buffer mặc định — nhập thêm 20% so với dự báo để phòng sai số
DEFAULT_SAFETY_FACTOR = 1.2


def predict_stockout_date(
    current_stock: float,
    forecast_df: pd.DataFrame,
) -> date | None:
    """
    Tính ngày hết hàng dự kiến dựa trên tồn kho hiện tại và dự báo tiêu thụ.

    Args:
        current_stock: Số lượng tồn kho hiện tại (theo đơn vị nguyên liệu)
        forecast_df: DataFrame từ NeuralProphet với cột 'ds' (datetime) và 'yhat1' (float)

    Returns:
        Ngày dự kiến hết hàng, hoặc None nếu tồn kho đủ trong toàn kỳ dự báo
    """
    if current_stock <= 0:
        # Đã hết hàng rồi
        return date.today()

    # Tích lũy tiêu thụ từng ngày cho đến khi vượt tồn kho hiện tại
    cumulative = 0.0
    for _, row in forecast_df.iterrows():
        # Không tính giá trị âm — tiêu thụ không thể âm
        cumulative += max(float(row["yhat1"]), 0.0)
        if cumulative >= current_stock:
            return row["ds"].date()

    return None  # Tồn kho đủ dùng trong toàn kỳ dự báo


def calc_order_qty(
    forecast_df: pd.DataFrame,
    safety_factor: float = DEFAULT_SAFETY_FACTOR,
) -> float:
    """
    Tính số lượng gợi ý nhập dựa trên tổng tiêu thụ dự báo + safety buffer.

    Args:
        forecast_df: DataFrame với cột 'yhat1'
        safety_factor: Hệ số an toàn (mặc định 1.2 = nhập thêm 20%)

    Returns:
        Số lượng gợi ý nhập (đã làm tròn lên)
    """
    total_forecast = sum(max(float(row["yhat1"]), 0.0) for _, row in forecast_df.iterrows())
    return round(total_forecast * safety_factor, 2)
