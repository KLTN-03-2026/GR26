"""
Định nghĩa các cron jobs — train, predict, fetch weather.

Jobs:
- train_all_tenants:    Chủ nhật 2:00 AM — train Global Model cho tất cả tenant
- predict_all_branches: Hàng đêm 00:30 AM — predict 7 ngày + tính kho
- fetch_weather_all:    Hàng ngày 6:00 AM — cập nhật thời tiết tất cả chi nhánh

Nguyên tắc: mọi job đều bắt exception và KHÔNG re-raise.
Scheduler tiếp tục chạy kể cả khi 1 job thất bại.
"""

import time

from app.core.database import AsyncSessionLocal
from app.core.logging import get_logger

logger = get_logger(__name__)


async def train_all_tenants() -> None:
    """
    Cron job train Global Model cho tất cả tenant đang active.
    Lịch: Chủ nhật 2:00 AM (TRAIN_CRON_HOUR=2, TRAIN_CRON_DAY_OF_WEEK=sun).
    """
    from app.services import train_service  # import muộn tránh circular

    start = time.monotonic()
    logger.info("=== JOB TRAIN BẮT ĐẦU ===")

    try:
        async with AsyncSessionLocal() as db:
            results = await train_service.run_train_all_tenants(db)

        success = sum(1 for r in results if r.get("status") == "success")
        duration = time.monotonic() - start
        logger.info(
            "=== JOB TRAIN XONG: %d/%d tenant | %.1fs ===",
            success, len(results), duration,
        )
    except Exception as exc:
        logger.error(
            "JOB TRAIN THẤT BẠI sau %.1fs: %s",
            time.monotonic() - start, exc,
        )
        # KHÔNG re-raise — scheduler tiếp tục chạy lần sau


async def predict_all_branches() -> None:
    """
    Cron job predict 7 ngày tới cho tất cả chi nhánh của mọi tenant.
    Lịch: Hàng đêm 00:30 AM.
    """
    from app.services import predict_service  # import muộn tránh circular

    start = time.monotonic()
    logger.info("=== JOB PREDICT BẮT ĐẦU ===")

    try:
        async with AsyncSessionLocal() as db:
            await predict_service.predict_all_branches(db)

        duration = time.monotonic() - start
        logger.info("=== JOB PREDICT XONG: %.1fs ===", duration)
    except Exception as exc:
        logger.error(
            "JOB PREDICT THẤT BẠI sau %.1fs: %s",
            time.monotonic() - start, exc,
        )
        # KHÔNG re-raise — scheduler tiếp tục chạy lần sau


async def fetch_weather_all() -> None:
    """
    Cron job fetch và cache thời tiết cho tất cả chi nhánh.
    Lịch: Hàng ngày 6:00 AM.
    """
    from app.services import weather_service  # import muộn tránh circular

    start = time.monotonic()
    logger.info("=== JOB FETCH WEATHER BẮT ĐẦU ===")

    try:
        async with AsyncSessionLocal() as db:
            await weather_service.fetch_all_branches_weather(db)

        duration = time.monotonic() - start
        logger.info("=== JOB FETCH WEATHER XONG: %.1fs ===", duration)
    except Exception as exc:
        logger.error(
            "JOB FETCH WEATHER THẤT BẠI sau %.1fs: %s",
            time.monotonic() - start, exc,
        )
        # KHÔNG re-raise — scheduler tiếp tục chạy lần sau
