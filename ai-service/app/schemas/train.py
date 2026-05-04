"""
Pydantic schemas cho train API.
"""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


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
    series_count: int                                  # Số series đã train thành công
    mae: float | None                                  # MAE cuối cùng (None nếu failed)
    mape: float | None = None                          # MAPE % — dễ giải thích hơn MAE (VD: 8.7%)
    duration_seconds: float                            # Thời gian train (giây)
    model_path: str | None                             # Path file .np đã lưu
    series_skipped: list[str] = []                     # Series bị skip do không đủ data (< 30 ngày)
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
    status: str           # queued
    branch_id: str | None = None  # None = chạy cho tất cả branch


class TrainConfigRequest(BaseModel):
    """
    Request body khi chủ quán cập nhật config train cho 1 chi nhánh.
    Gửi qua PUT /api/v1/train/config?branch_id=...
    """

    model_config = ConfigDict(from_attributes=True)

    # Lấy data từ ngày nào — null = từ đơn đầu tiên của branch
    start_date: date | None = Field(
        default=None,
        description="Lấy data từ ngày này. Null = từ đơn đầu tiên của chi nhánh",
    )

    n_forecasts: int = Field(
        default=7, ge=1, le=30,
        description="Dự báo bao nhiêu ngày tới (1-30)",
    )
    epochs: int = Field(
        default=100, ge=20, le=500,
        description="Số vòng train (20-500). Cao hơn thì chính xác hơn nhưng chậm hơn",
    )
    weekly_seasonality: bool = Field(
        default=True,
        description="Bật/tắt nhận dạng pattern cuối tuần. Nên bật với quán F&B",
    )


class TrainConfigResponse(BaseModel):
    """
    Config train hiện tại của 1 chi nhánh — kèm thống kê data thực tế.
    Trả về từ GET và PUT /api/v1/train/config?branch_id=...
    """

    model_config = ConfigDict(from_attributes=True)

    branch_id: str
    start_date: date | None

    # Hyperparameters do user cấu hình
    n_forecasts: int
    epochs: int
    weekly_seasonality: bool

    # Thông số hệ thống tự tính — chỉ đọc, không chỉnh thủ công
    n_lags_auto: int = Field(
        description="Số ngày nhìn lại khi predict — tự tính từ số ngày data của branch"
    )
    yearly_seasonality_auto: bool = Field(
        description="True khi chi nhánh có ≥ 730 ngày data — hệ thống tự bật"
    )

    # Thống kê data thực tế của chi nhánh
    active_days: int = Field(description="Số ngày chi nhánh có đơn hàng")
    first_order_date: date | None = Field(description="Ngày đơn hàng đầu tiên")
    last_order_date: date | None = Field(description="Ngày đơn hàng gần nhất")

    # Trạng thái model hiện tại
    model_exists: bool = Field(description="Chi nhánh đã được train hay chưa")


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
    mae: float | None                 # MAE cuối cùng (kỹ thuật)
    mape: float | None                # MAPE % — dễ giải thích cho chủ quán hơn MAE
    model_exists: bool                # File .np có tồn tại trên disk không


class TrainLogItem(BaseModel):
    """
    Thông tin 1 lần chạy train — dùng trong GET /train/logs.

    Bao gồm thời gian, kết quả MAE/MAPE, số series, lỗi (nếu có).
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    branch_id: str | None
    started_at: datetime
    finished_at: datetime | None
    status: str                        # running | success | failed
    trigger_type: str                  # scheduled | manual
    series_count: int | None
    mae: float | None
    mape: float | None                 # Đọc từ train_metadata.json — None nếu chưa có
    error_message: str | None
    duration_seconds: float | None     # Thời gian chạy (giây) — None nếu chưa kết thúc


class TrainLogsResponse(BaseModel):
    """Response cho GET /train/logs — danh sách nhiều lần train gần nhất."""

    model_config = ConfigDict(from_attributes=True)

    tenant_id: str
    branch_id: str | None   # None = lấy tất cả branch
    logs: list[TrainLogItem]
    total: int               # Tổng số log đang trả về (= len(logs))
