"""
Health check endpoint — Spring Boot ping để kiểm tra AI Service còn sống.
Không cần auth, response time phải < 100ms.
"""

import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import AsyncSessionLocal
from app.utils import model_io

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check() -> dict:
    """
    Kiểm tra trạng thái AI Service, DB, scheduler và số model đã train.

    Không để health check crash app nếu DB down — bắt exception và trả "error".
    Timeout DB check: 2 giây.

    Returns:
        dict với status, db, scheduler, models_loaded
    """
    # Ping database — timeout 2 giây tránh health check bị block lâu
    db_status = "error: unknown"
    try:
        async with asyncio.timeout(2.0):
            async with AsyncSessionLocal() as db:
                await db.execute(text("SELECT 1"))
        db_status = "connected"
    except TimeoutError:
        db_status = "error: timeout"
    except Exception as exc:
        db_status = f"error: {exc!s}"[:100]  # Giới hạn độ dài error message

    # Trạng thái scheduler — import muộn để tránh circular khi module chưa init
    scheduler_status = "stopped"
    try:
        from app.scheduler.runner import get_scheduler_status
        scheduler_status = get_scheduler_status()
    except Exception:
        scheduler_status = "unknown"

    # Đếm số tenant đã có model file trên disk
    models_loaded = 0
    try:
        models_loaded = len(model_io.list_all_models())
    except Exception:
        pass

    return {
        "status": "ok",
        "service": "smartfnb-ai",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "db": db_status,
        "scheduler": scheduler_status,
        "models_loaded": models_loaded,
    }
