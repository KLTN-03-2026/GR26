"""
Pydantic schemas cho train API.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class TrainRequest(BaseModel):
    """
    Request body cho POST /api/v1/train (manual trigger).

    tenant_id mặc định None → lấy từ JWT token của request.
    Truyền tenant_id tường minh khi cần trigger cho tenant cụ thể (admin).
    """

    model_config = ConfigDict(from_attributes=True)

    tenant_id: str | None = None  # None = dùng tenant từ JWT token


class TrainResult(BaseModel):
    """
    Kết quả của 1 lần train — trả về sau khi train job hoàn thành.

    Dùng trong response của cả API lẫn scheduler job để log kết quả.
    """

    model_config = ConfigDict(from_attributes=True)

    tenant_id: str
    status: Literal["success", "skipped", "failed"]  # Kết quả train
    series_count: int                                  # Số series đã train
    mae: float | None                                  # MAE cuối cùng (None nếu failed)
    duration_seconds: float                            # Thời gian train (giây)
    model_path: str | None                             # Path file .np đã lưu
    error: str | None = None                           # Mô tả lỗi nếu failed


class TrainTriggerResponse(BaseModel):
    """Response tức thì khi trigger train thủ công — trả ngay, chưa chờ kết quả."""

    model_config = ConfigDict(from_attributes=True)

    message: str
    tenant_id: str
    status: str  # queued | running


class PredictTriggerResponse(BaseModel):
    """Response tức thì khi trigger predict thủ công."""

    model_config = ConfigDict(from_attributes=True)

    message: str
    status: str  # queued


class TrainStatusResponse(BaseModel):
    """
    Trạng thái lần train gần nhất của tenant.

    Đọc từ bảng train_logs kết hợp train_metadata.json.
    """

    model_config = ConfigDict(from_attributes=True)

    tenant_id: str
    last_trained_at: datetime | None  # None nếu chưa train lần nào
    status: str | None                # success | failed | running | None
    series_count: int | None          # Số series đã train
    mae: float | None                 # MAE cuối cùng
    model_exists: bool                # File .np có tồn tại trên disk không
