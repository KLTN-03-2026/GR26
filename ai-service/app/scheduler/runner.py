"""
APScheduler setup — khởi động và quản lý cron jobs.
Được gọi trong lifespan() của main.py.
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.config import settings
from app.core.logging import get_logger
from app.scheduler.jobs import fetch_weather_all, predict_all_branches, train_all_tenants

logger = get_logger(__name__)

# Singleton scheduler
_scheduler = AsyncIOScheduler(timezone="Asia/Ho_Chi_Minh")


def start_scheduler() -> None:
    """
    Đăng ký tất cả cron jobs và khởi động scheduler.
    Gọi một lần trong startup của FastAPI app.
    """
    # Job 1: Train Global Model — Chủ nhật 2:00 AM
    _scheduler.add_job(
        train_all_tenants,
        trigger="cron",
        hour=settings.train_cron_hour,
        day_of_week=settings.train_cron_day_of_week,
        id="train_all_tenants",
        replace_existing=True,
    )

    # Job 2: Predict tất cả chi nhánh — hàng đêm 00:30 AM
    _scheduler.add_job(
        predict_all_branches,
        trigger="cron",
        hour=settings.predict_cron_hour,
        minute=settings.predict_cron_minute,
        id="predict_all_branches",
        replace_existing=True,
    )

    # Job 3: Fetch weather — hàng ngày 6:00 AM
    _scheduler.add_job(
        fetch_weather_all,
        trigger="cron",
        hour=settings.weather_cron_hour,
        id="fetch_weather_all",
        replace_existing=True,
    )

    _scheduler.start()
    logger.info(
        "Scheduler khởi động — %d jobs đã đăng ký",
        len(_scheduler.get_jobs()),
    )


def stop_scheduler() -> None:
    """Dừng scheduler gracefully khi app tắt."""
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler đã dừng")
