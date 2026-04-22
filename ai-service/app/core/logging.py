"""
Cấu hình logging cho AI Service.

Ghi log ra 5 nơi đồng thời:
  1. Console (stdout)              — luôn bật, tiện khi dev và xem Docker logs
  2. logs/YYYY-MM-DD/app.log      — INFO+ toàn bộ module
  3. logs/YYYY-MM-DD/train.log    — INFO+ chỉ train_service + scheduler
  4. logs/YYYY-MM-DD/warning.log  — WARNING+ toàn bộ module
  5. logs/YYYY-MM-DD/combined.log — tất cả level, tất cả module (log tổng hợp)

Mỗi ngày tự tạo folder mới: logs/2026-04-17/, logs/2026-04-18/, ...
File log không bao giờ xóa tự động — dọn thủ công hoặc cấu hình ngoài (logrotate).
"""

import logging
import sys
import threading
from datetime import date
from pathlib import Path

from app.core.config import settings

# Format chung cho tất cả handler
_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Tên logger của các module liên quan đến train — ghi vào train.log
_TRAIN_LOGGERS = {
    "app.services.train_service",
    "app.scheduler.jobs",
    "app.scheduler.runner",
}


class _TrainFilter(logging.Filter):
    """
    Chỉ cho phép log record từ các module train/scheduler đi qua.
    Dùng cho FileHandler của train.log.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        # Cho phép nếu tên logger bắt đầu bằng bất kỳ prefix nào trong _TRAIN_LOGGERS
        return any(record.name.startswith(name) for name in _TRAIN_LOGGERS)


class DailyFolderFileHandler(logging.Handler):
    """
    Handler ghi log vào file, tổ chức theo folder ngày.

    Mỗi ngày tạo folder mới: logs/YYYY-MM-DD/<filename>
    Tự động chuyển sang file mới khi sang ngày — không cần restart service.
    Thread-safe: dùng Lock để tránh race condition khi xoay file.

    Args:
        log_dir: Folder gốc chứa log (ví dụ: Path("./logs"))
        filename: Tên file log (ví dụ: "app.log")
        level: Log level cho handler này
    """

    def __init__(self, log_dir: Path, filename: str, level: int = logging.DEBUG) -> None:
        super().__init__(level)
        self.log_dir = log_dir
        self.filename = filename
        self._lock = threading.Lock()
        self._current_date: str = ""
        self._file_handler: logging.FileHandler | None = None

    def _rotate_if_needed(self) -> logging.FileHandler:
        """
        Kiểm tra ngày hiện tại — nếu sang ngày mới thì đóng file cũ, mở file mới.
        Tạo folder logs/YYYY-MM-DD/ nếu chưa có.

        Returns:
            FileHandler đang active cho ngày hôm nay
        """
        today = date.today().isoformat()  # "2026-04-17"

        if today != self._current_date or self._file_handler is None:
            # Đóng file cũ trước khi mở file mới
            if self._file_handler is not None:
                self._file_handler.close()

            # Tạo folder theo ngày
            folder = self.log_dir / today
            folder.mkdir(parents=True, exist_ok=True)

            # Mở file mới — append mode, giữ log nếu service restart trong cùng ngày
            file_path = folder / self.filename
            self._file_handler = logging.FileHandler(
                str(file_path), mode="a", encoding="utf-8"
            )
            self._file_handler.setFormatter(self.formatter)
            self._current_date = today

        return self._file_handler

    def emit(self, record: logging.LogRecord) -> None:
        """Ghi 1 log record vào file — thread-safe."""
        try:
            with self._lock:
                handler = self._rotate_if_needed()
                handler.emit(record)
        except Exception:
            self.handleError(record)

    def close(self) -> None:
        """Đóng file handler khi shutdown service."""
        with self._lock:
            if self._file_handler is not None:
                self._file_handler.close()
                self._file_handler = None
        super().close()


def setup_logging() -> None:
    """
    Khởi tạo logging toàn app. Gọi một lần duy nhất trong main.py startup.

    Tạo 5 handler:
    - Console: INFO+ ra stdout
    - app.log: INFO+ tất cả module, ghi theo folder ngày
    - train.log: INFO+ chỉ train_service + scheduler
    - warning.log: WARNING+ tất cả module, dùng để alert/monitor
    - combined.log: tất cả level (DEBUG+), log tổng hợp đầy đủ nhất

    Log level gốc đọc từ LOG_LEVEL trong .env (mặc định INFO).
    """
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    log_dir = Path(settings.log_dir)
    formatter = logging.Formatter(fmt=_LOG_FORMAT, datefmt=_DATE_FORMAT)

    # ── 1. Console handler ────────────────────────────────────────────────
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)

    # ── 2. app.log — INFO+ tất cả module ─────────────────────────────────
    app_handler = DailyFolderFileHandler(log_dir, "app.log", level=logging.INFO)
    app_handler.setFormatter(formatter)

    # ── 3. train.log — INFO+ chỉ train/scheduler ─────────────────────────
    train_handler = DailyFolderFileHandler(log_dir, "train.log", level=logging.INFO)
    train_handler.setFormatter(formatter)
    train_handler.addFilter(_TrainFilter())

    # ── 4. warning.log — WARNING+ tất cả module ──────────────────────────
    warning_handler = DailyFolderFileHandler(log_dir, "warning.log", level=logging.WARNING)
    warning_handler.setFormatter(formatter)

    # ── 5. combined.log — tất cả level, tất cả module (log tổng hợp) ─────
    combined_handler = DailyFolderFileHandler(log_dir, "combined.log", level=logging.DEBUG)
    combined_handler.setFormatter(formatter)

    # Gắn tất cả handler vào root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)  # Root nhận tất cả, handler tự filter
    root_logger.addHandler(console_handler)
    root_logger.addHandler(app_handler)
    root_logger.addHandler(train_handler)
    root_logger.addHandler(warning_handler)
    root_logger.addHandler(combined_handler)

    # Giảm noise từ các thư viện bên ngoài
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("neuralprophet").setLevel(logging.WARNING)
    logging.getLogger("pytorch_lightning").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Lấy logger theo tên module. Dùng thay cho print() trong mọi nơi.

    Ví dụ:
        logger = get_logger(__name__)
        logger.info("Bắt đầu train branch=%s", branch_id)
    """
    return logging.getLogger(name)
