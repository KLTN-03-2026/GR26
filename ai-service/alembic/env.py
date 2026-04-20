"""
Alembic environment config — async SQLAlchemy cho AI Service.

Quản lý schema riêng của AI Service (ai_series_registry, forecast_results,
consumption_history, model_registry, train_logs).
Độc lập với Flyway của BE Spring Boot.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

# Import settings để lấy DATABASE_URL từ .env
from app.core.config import settings

# Import tất cả models để Alembic autogenerate nhận ra metadata
from app.core.database import Base
from app.models import (  # noqa: F401 — import để register vào Base.metadata
    consumption_history,
    forecast_result,
    model_registry,
    series_registry,
    train_log,
)

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata của tất cả AI models
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Chạy offline (generate SQL script, không cần kết nối DB thật)."""
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    """Thực thi migration với connection đã mở."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Tạo async engine và chạy migration."""
    engine = create_async_engine(settings.database_url, echo=False)
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online() -> None:
    """Entry point chính khi chạy `alembic upgrade head`."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
