"""
Cấu hình logging cho AI Service.
Dùng standard logging với format JSON-friendly để dễ đọc trong Docker logs.
"""

import logging
import sys

from app.core.config import settings


def setup_logging() -> None:
    """
    Khởi tạo logging toàn app. Gọi một lần duy nhất trong main.py startup.
    Log level đọc từ biến môi trường LOG_LEVEL (mặc định INFO).
    """
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
    )

    # Giảm noise từ các thư viện bên ngoài
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Lấy logger theo tên module. Dùng thay cho print() trong mọi nơi.

    Ví dụ:
        logger = get_logger(__name__)
        logger.info("Bắt đầu train model tenant_id=%s", tenant_id)
    """
    return logging.getLogger(name)
