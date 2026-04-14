"""
FastAPI application entry point — SmartF&B AI Service.

Khởi động: uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import health, forecast, train, series
from app.core.config import settings
from app.core.logging import get_logger, setup_logging

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Quản lý vòng đời app — startup và shutdown.
    Startup: kiểm tra kết nối DB, khởi động APScheduler.
    Shutdown: dừng scheduler gracefully.
    """
    # --- Startup ---
    logger.info("SmartF&B AI Service đang khởi động...")
    logger.info("Port: %s | Log level: %s", settings.ai_service_port, settings.log_level)

    # TODO: Khởi động APScheduler trong sprint scheduler
    # from app.scheduler.runner import start_scheduler
    # await start_scheduler()

    logger.info("AI Service sẵn sàng nhận request.")
    yield

    # --- Shutdown ---
    logger.info("AI Service đang tắt...")
    # TODO: await stop_scheduler()


app = FastAPI(
    title="SmartF&B AI Service",
    description="Dự báo tiêu thụ nguyên liệu cho chuỗi F&B — NeuralProphet + FastAPI",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — cho phép BE Spring Boot (port 8080) và FE React (port 5173) gọi
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(health.router)
app.include_router(forecast.router, prefix="/api/v1")
app.include_router(train.router, prefix="/api/v1")
app.include_router(series.router, prefix="/api/v1")
