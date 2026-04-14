"""
SQLAlchemy async engine và session factory.

Lưu ý kiến trúc:
- AI Service CHỈ ĐỌC các bảng của BE (orders, ingredients, recipes, branches...)
- AI Service GHI vào bảng riêng (forecast_results, train_logs)
- Các bảng AI được tạo qua Flyway migration của BE — KHÔNG dùng create_all ở đây
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Async engine kết nối PostgreSQL qua asyncpg driver
engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,   # Kiểm tra kết nối trước mỗi lần dùng
    pool_size=10,
    max_overflow=20,
    echo=False,           # Đặt True khi debug SQL
)

# Session factory — dùng trong get_db() và scheduler jobs
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Tránh lazy load lỗi sau commit
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class cho tất cả SQLAlchemy ORM models của AI Service."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency FastAPI — cung cấp AsyncSession cho mỗi request.
    Session tự đóng khi request kết thúc (dù thành công hay lỗi).
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
