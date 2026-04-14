"""
Weather Service — lấy dữ liệu thời tiết từ Open-Meteo API.

Open-Meteo là API miễn phí, không cần API key cho forecast ngắn hạn.
Kết quả cache trong DB để tránh gọi lại nhiều lần trong ngày.
"""

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger

logger = get_logger(__name__)


async def fetch_and_cache_weather(
    db: AsyncSession,
    branch_id: str,
    lat: float,
    lng: float,
    target_date: date,
) -> dict | None:
    """
    Lấy thời tiết cho chi nhánh tại ngày cụ thể.
    Ưu tiên dùng cache trong DB — chỉ gọi Open-Meteo nếu cache miss.

    Args:
        branch_id: ID chi nhánh
        lat: Vĩ độ chi nhánh
        lng: Kinh độ chi nhánh
        target_date: Ngày cần lấy thời tiết

    Returns:
        dict với temperature_max (°C) và precipitation (mm), hoặc None nếu lỗi
    """
    # TODO: implement trong sprint weather
    raise NotImplementedError
