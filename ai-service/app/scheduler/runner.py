"""
APScheduler setup — khởi động và quản lý cron jobs.
Được gọi trong lifespan() của main.py.
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.core.logging import get_logger
from app.scheduler.jobs import fetch_weather_all, predict_all_branches, train_all_tenants

logger = get_logger(__name__)

# Singleton scheduler — timezone mặc định Việt Nam
_scheduler = AsyncIOScheduler(timezone="Asia/Ho_Chi_Minh")


def start_scheduler() -> None:
    """
    Đăng ký tất cả cron jobs và khởi động scheduler.
    Gọi một lần trong startup của FastAPI app.

    misfire_grace_time: Thời gian tối đa (giây) cho phép job chạy muộn
    khi server restart đúng lúc job phải chạy. Sau khoảng này → bỏ qua.
    """
    # Job 1: Train Global Model — Chủ nhật 2:00 AM
    _scheduler.add_job(
        train_all_tenants,
        CronTrigger(
            day_of_week=settings.train_cron_day_of_week,
            hour=settings.train_cron_hour,
            minute=0,
            timezone="Asia/Ho_Chi_Minh",
        ),
        id="job_train_all",
        replace_existing=True,
        misfire_grace_time=3600,  # Cho phép chạy muộn 1 tiếng nếu server restart
    )

    # Job 2: Predict tất cả chi nhánh — hàng đêm 00:30 AM
    _scheduler.add_job(
        predict_all_branches,
        CronTrigger(
            hour=settings.predict_cron_hour,
            minute=settings.predict_cron_minute,
            timezone="Asia/Ho_Chi_Minh",
        ),
        id="job_predict_all",
        replace_existing=True,
        misfire_grace_time=1800,  # Cho phép chạy muộn 30 phút
    )

    # Job 3: Fetch weather — hàng ngày 6:00 AM
    _scheduler.add_job(
        fetch_weather_all,
        CronTrigger(
            hour=settings.weather_cron_hour,
            minute=0,
            timezone="Asia/Ho_Chi_Minh",
        ),
        id="job_fetch_weather",
        replace_existing=True,
        misfire_grace_time=3600,
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


def get_scheduler_status() -> str:
    """Trả về trạng thái scheduler: 'running' hoặc 'stopped'."""
    return "running" if _scheduler.running else "stopped"
