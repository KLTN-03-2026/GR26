"""
Endpoint trigger train model thủ công (dành cho Owner/Admin).
Thông thường train chạy tự động theo cron — endpoint này dùng khi cần force retrain.
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant, get_db
from app.core.database import AsyncSessionLocal
from app.core.logging import get_logger
from app.core.security import TokenPayload
from app.models.train_log import TrainLog
from app.schemas.train import TrainRequest, TrainStatusResponse, TrainTriggerResponse, PredictTriggerResponse
from app.utils import model_io

router = APIRouter(prefix="/train", tags=["Train"])
logger = get_logger(__name__)

# Roles được phép trigger train thủ công
_ALLOWED_ROLES = {"OWNER", "ADMIN"}


async def run_train_background(tenant_id: str) -> None:
    """
    Background task wrapper cho train job.

    Tạo session riêng — KHÔNG tái dùng session của request (đã đóng khi trả response).
    Lỗi không bubble up vì background task chạy ngoài request context.
    """
    from app.services import train_service  # import muộn tránh circular

    async with AsyncSessionLocal() as db:
        try:
            await train_service.run_train_for_tenant(db, tenant_id, trigger_type="manual")
            logger.info("Background train hoàn thành: tenant=%s", tenant_id)
        except Exception as exc:
            logger.error(
                "Background train thất bại: tenant=%s | %s",
                tenant_id, exc,
            )


@router.post("/trigger", response_model=TrainTriggerResponse)
async def trigger_train(
    background_tasks: BackgroundTasks,
    body: TrainRequest = TrainRequest(),
    tenant: TokenPayload = Depends(get_current_tenant),
) -> TrainTriggerResponse:
    """
    Trigger train thủ công cho tenant — chỉ OWNER hoặc ADMIN mới được gọi.
    Chạy background task, trả về ngay không chờ kết quả.

    Args:
        body: TrainRequest — tenant_id optional, None = dùng tenant từ JWT

    Returns:
        TrainTriggerResponse với status="queued"

    Raises:
        HTTPException 403: Role không đủ quyền
    """
    # Kiểm tra role — chỉ OWNER hoặc ADMIN mới được trigger train thủ công
    if tenant.role not in _ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Chỉ {'/'.join(_ALLOWED_ROLES)} mới được trigger train. Role hiện tại: {tenant.role}",
        )

    # Dùng tenant_id từ body nếu có (admin trigger cho tenant khác),
    # còn lại dùng từ JWT token
    target_tenant_id = body.tenant_id or tenant.tenant_id

    # Đưa vào background — KHÔNG block request
    background_tasks.add_task(run_train_background, target_tenant_id)

    logger.info("Trigger train thủ công: tenant=%s by user=%s", target_tenant_id, tenant.user_id)

    return TrainTriggerResponse(
        message="Train job đã được khởi động",
        tenant_id=target_tenant_id,
        status="queued",
    )


@router.get("/status", response_model=TrainStatusResponse)
async def get_train_status(
    tenant: TokenPayload = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> TrainStatusResponse:
    """
    Xem trạng thái lần train gần nhất của tenant hiện tại.
    Đọc từ bảng train_logs — không check trực tiếp model file.

    Returns:
        TrainStatusResponse với last_trained_at, status, mae, model_exists
    """
    # Lấy train log mới nhất của tenant từ JWT
    stmt = (
        select(TrainLog)
        .where(TrainLog.tenant_id == tenant.tenant_id)
        .order_by(desc(TrainLog.started_at))
        .limit(1)
    )
    result = await db.execute(stmt)
    latest_log = result.scalar_one_or_none()

    # Kiểm tra file model trên disk (không cần load)
    exists = model_io.model_exists(tenant.tenant_id)

    if latest_log is None:
        return TrainStatusResponse(
            tenant_id=tenant.tenant_id,
            last_trained_at=None,
            status=None,
            series_count=None,
            mae=None,
            model_exists=exists,
        )

    return TrainStatusResponse(
        tenant_id=tenant.tenant_id,
        last_trained_at=latest_log.finished_at or latest_log.started_at,
        status=latest_log.status,
        series_count=latest_log.series_count,
        mae=latest_log.mae,
        model_exists=exists,
    )


async def run_predict_background() -> None:
    """Background task chạy predict cho tất cả branch — tạo session riêng."""
    from app.services import predict_service

    async with AsyncSessionLocal() as db:
        try:
            await predict_service.predict_all_branches(db)
            logger.info("Background predict hoàn thành")
        except Exception as exc:
            logger.error("Background predict thất bại: %s", exc)


@router.post("/predict", response_model=PredictTriggerResponse)
async def trigger_predict(
    background_tasks: BackgroundTasks,
    tenant: TokenPayload = Depends(get_current_tenant),
) -> PredictTriggerResponse:
    """
    Trigger predict thủ công cho tất cả branch — chỉ OWNER hoặc ADMIN.
    Chạy background, trả về ngay. Dùng để test hoặc force refresh forecast.
    """
    if tenant.role not in _ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Chỉ {'/'.join(_ALLOWED_ROLES)} mới được trigger predict.",
        )

    background_tasks.add_task(run_predict_background)
    logger.info("Trigger predict thủ công bởi user=%s", tenant.user_id)

    return PredictTriggerResponse(
        message="Predict job đã được khởi động",
        status="queued",
    )
