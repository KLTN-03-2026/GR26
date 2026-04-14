"""
Định nghĩa các cron jobs — train, predict, fetch weather.

Jobs:
- train_all_tenants: Chủ nhật 2:00 AM — train Global Model cho tất cả tenant
- predict_all_branches: Hàng đêm 00:30 AM — predict 7 ngày + tính kho
- fetch_weather_all: Hàng ngày 6:00 AM — cập nhật thời tiết tất cả chi nhánh
"""

from app.core.database import AsyncSessionLocal
from app.core.logging import get_logger

logger = get_logger(__name__)


async def train_all_tenants() -> None:
    """
    Cron job train Global Model cho tất cả tenant đang active.
    Lịch: Chủ nhật 2:00 AM (TRAIN_CRON_HOUR=2, TRAIN_CRON_DAY_OF_WEEK=sun).
    """
    logger.info("=== Bắt đầu job train_all_tenants ===")
    from app.services.train_service import run_train_all_tenants

    async with AsyncSessionLocal() as db:
        results = await run_train_all_tenants(db)

    success = sum(1 for r in results if r["status"] == "success")
    logger.info(
        "=== Kết thúc train_all_tenants: %d/%d thành công ===",
        success, len(results),
    )


async def predict_all_branches() -> None:
    """
    Cron job predict 7 ngày tới cho tất cả chi nhánh của mọi tenant.
    Lịch: Hàng đêm 00:30 AM.
    """
    logger.info("=== Bắt đầu job predict_all_branches ===")
    # TODO: implement trong sprint predict
    logger.warning("predict_all_branches chưa implement")


async def fetch_weather_all() -> None:
    """
    Cron job fetch và cache thời tiết cho tất cả chi nhánh.
    Lịch: Hàng ngày 6:00 AM.
    """
    logger.info("=== Bắt đầu job fetch_weather_all ===")
    # TODO: implement trong sprint weather
    logger.warning("fetch_weather_all chưa implement")
