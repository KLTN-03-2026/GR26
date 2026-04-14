"""
Pydantic schemas cho train API.
"""

from datetime import datetime

from pydantic import BaseModel


class TrainTriggerResponse(BaseModel):
    """Response khi trigger train thủ công."""

    message: str
    tenant_id: str
    status: str   # queued | running


class TrainStatusResponse(BaseModel):
    """Trạng thái lần train gần nhất của tenant."""

    tenant_id: str
    status: str               # running | success | failed
    started_at: datetime
    finished_at: datetime | None
    series_count: int | None  # Số series đã train
    mae: float | None         # MAE cuối cùng
    error_message: str | None
