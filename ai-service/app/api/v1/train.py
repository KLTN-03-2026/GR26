"""
Endpoint trigger train model thủ công (dành cho Owner/Admin).
Thông thường train chạy tự động theo cron — endpoint này chỉ dùng khi cần force retrain.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant, get_db
from app.core.security import TokenPayload

router = APIRouter(prefix="/train", tags=["Train"])


@router.post("/trigger")
async def trigger_train(
    db: AsyncSession = Depends(get_db),
    tenant: TokenPayload = Depends(get_current_tenant),
) -> dict:
    """
    Trigger train thủ công cho tenant hiện tại.
    Chạy background task — trả về job_id để theo dõi qua /train/status.

    Returns:
        dict với job_id và trạng thái khởi tạo
    """
    # TODO: implement trong sprint train
    raise NotImplementedError("Endpoint chưa implement — chờ train_service")


@router.get("/status/{tenant_id}")
async def get_train_status(
    tenant_id: str,
    db: AsyncSession = Depends(get_db),
    tenant: TokenPayload = Depends(get_current_tenant),
) -> dict:
    """
    Xem trạng thái và kết quả lần train gần nhất của tenant.

    Args:
        tenant_id: ID tenant cần xem trạng thái

    Returns:
        TrainStatusResponse với started_at, status, mae, error_message
    """
    # TODO: implement trong sprint train
    raise NotImplementedError("Endpoint chưa implement — chờ train_service")
