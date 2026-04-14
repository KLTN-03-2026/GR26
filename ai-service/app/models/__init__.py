# Import tất cả models để SQLAlchemy và Alembic nhận ra metadata
from app.models.series_registry import AiSeriesRegistry
from app.models.consumption_history import ConsumptionHistory
from app.models.forecast_result import ForecastResult
from app.models.model_registry import ModelRegistry
from app.models.train_log import TrainLog

__all__ = [
    "AiSeriesRegistry",
    "ConsumptionHistory",
    "ForecastResult",
    "ModelRegistry",
    "TrainLog",
]
