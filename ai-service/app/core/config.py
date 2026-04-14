"""
Cấu hình ứng dụng — đọc từ file .env thông qua Pydantic BaseSettings.
Mọi giá trị đều có default hợp lý để dev có thể chạy không cần .env đầy đủ.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Toàn bộ config của AI Service đọc từ biến môi trường / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        protected_namespaces=("settings_",),  # Bỏ warning về field 'model_*'
    )

    # --- Database ---
    database_url: str = (
        "postgresql+asyncpg://smartfnb:password@localhost:5432/smartfnb_db"
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

    # --- Scheduler ---
    train_cron_hour: int = 2
    train_cron_day_of_week: str = "sun"
    predict_cron_hour: int = 0
    predict_cron_minute: int = 30
    weather_cron_hour: int = 6

    # --- Weather API ---
    weather_cache_days: int = 1

    # --- NeuralProphet ---
    np_n_lags: int = 14
    np_n_forecasts: int = 7
    np_epochs: int = 100


# Singleton — import và dùng trực tiếp trong toàn app
settings = Settings()
