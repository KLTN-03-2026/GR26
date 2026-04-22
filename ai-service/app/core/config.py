"""
Cấu hình ứng dụng — đọc từ file .env thông qua Pydantic BaseSettings.
Mọi giá trị đều có default hợp lý để dev có thể chạy không cần .env đầy đủ.
"""

import logging

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_log = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Toàn bộ config của AI Service đọc từ biến môi trường / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        protected_namespaces=("settings_",),  # Bỏ warning về field 'model_*'
    )

    # --- Môi trường ---
    env: str = "development"  # development | production | test

    # --- Database ---
    database_url: str = (
        "postgresql+asyncpg://smartfnb:password@localhost:5433/smartfnb_db"
    )

    # --- AI Service ---
    ai_service_host: str = "0.0.0.0"
    ai_service_port: int = 8001
    log_level: str = "INFO"

    # --- Security ---
    jwt_secret: str = "changeme"
    jwt_algorithm: str = "HS256"

    # --- Model Storage ---
    model_storage_dir: str = "./storage/models"

    # --- Logging ---
    log_dir: str = "./logs"  # Folder gốc chứa log — tổ chức theo ngày bên trong

    # --- Scheduler ---
    train_cron_hour: int = 2
    train_cron_day_of_week: str = "sun"
    predict_cron_hour: int = 0
    predict_cron_minute: int = 30
    weather_cron_hour: int = 6

    # --- Weather API ---
    weather_cache_days: int = 1

    # --- NeuralProphet ---
    np_n_lags: int = 28
    np_n_forecasts: int = 7
    np_epochs: int = 150
    np_batch_size: int = 32
    np_min_days_required: int = 30

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        """
        Kiểm tra cấu hình quan trọng khi chạy production.
        Cảnh báo sớm để tránh deploy với giá trị mặc định không an toàn.
        """
        # Bắt buộc đổi jwt_secret trong production
        if self.env == "production" and self.jwt_secret == "changeme":
            raise ValueError(
                "jwt_secret='changeme' KHÔNG được dùng trong production! "
                "Đặt JWT_SECRET trong biến môi trường."
            )

        # Cảnh báo nếu database_url vẫn dùng localhost (có thể là nhầm config)
        if "localhost" in self.database_url and self.env == "production":
            _log.warning(
                "database_url đang trỏ vào localhost trong môi trường production — "
                "kiểm tra lại DATABASE_URL."
            )

        return self


# Singleton — import và dùng trực tiếp trong toàn app
settings = Settings()
