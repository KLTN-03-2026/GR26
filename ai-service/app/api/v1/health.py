"""
Health check endpoint — Spring Boot ping để kiểm tra AI Service còn sống.
Không cần auth, response time phải < 100ms.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Kiểm tra trạng thái AI Service và kết nối database.

    Returns:
        dict với status, service name, version và db connectivity
    """
    # Ping database để xác nhận kết nối còn hoạt động
    db_ok = False
    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status": "ok",
        "service": "smartfnb-ai",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected" if db_ok else "disconnected",
    }
