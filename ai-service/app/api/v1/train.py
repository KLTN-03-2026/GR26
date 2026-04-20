"""
Endpoint trigger train model thủ công và quản lý config train per-branch.

Endpoints:
- POST /train/trigger           — trigger train thủ công cho toàn bộ branch của tenant
- GET  /train/status            — trạng thái train gần nhất (optional: theo branch)
- GET  /train/config            — đọc config train của 1 chi nhánh
- PUT  /train/config            — cập nhật config + trigger retrain chi nhánh đó
- POST /train/predict           — trigger predict thủ công
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant, get_db
from app.core.database import AsyncSessionLocal
from app.core.logging import get_logger
from app.core.security import TokenPayload
from app.models.train_log import TrainLog
from app.schemas.train import (
    PredictTriggerResponse,
    TrainConfigRequest,
    TrainConfigResponse,
    TrainRequest,
    TrainStatusResponse,
    TrainTriggerResponse,
)
from app.utils import model_io

router = APIRouter(prefix="/train", tags=["Train"])
logger = get_logger(__name__)

# Roles được phép trigger train thủ công
_ALLOWED_ROLES = {"OWNER", "ADMIN"}


# ─────────────────────────────────────────────────────────────────────────────
# Background task helpers
# ─────────────────────────────────────────────────────────────────────────────

async def _run_train_tenant_bg(tenant_id: str) -> None:
    """
    Background task: train toàn bộ branch của tenant.
    Tạo session riêng — KHÔNG tái dùng session của request (đã đóng khi trả response).
    """
    from app.services import train_service

    async with AsyncSessionLocal() as db:
        try:
            results = await train_service.run_train_for_tenant(db, tenant_id, trigger_type="manual")
            success = sum(1 for r in results if r.get("status") == "success")
            logger.info(
                "Background train xong: tenant=%s | %d/%d branch thành công",
                tenant_id, success, len(results),
            )
        except Exception as exc:
            logger.error("Background train thất bại: tenant=%s | %s", tenant_id, exc)


async def _run_train_branch_bg(tenant_id: str, branch_id: str) -> None:
    """
    Background task: train 1 chi nhánh cụ thể.
    Dùng khi chủ quán thay đổi config của branch → retrain ngay branch đó.
    """
    from app.services import train_service

    async with AsyncSessionLocal() as db:
        try:
            result = await train_service.run_train_for_branch(
                db, tenant_id, branch_id, trigger_type="manual"
            )
            logger.info(
                "Background train branch xong: tenant=%s branch=%s | status=%s",
                tenant_id, branch_id, result.get("status"),
            )
        except Exception as exc:
            logger.error(
                "Background train branch thất bại: tenant=%s branch=%s | %s",
                tenant_id, branch_id, exc,
            )


async def _run_predict_bg() -> None:
    """Background task chạy predict cho tất cả branch — tạo session riêng."""
    from app.services import predict_service

    async with AsyncSessionLocal() as db:
        try:
            await predict_service.predict_all_branches(db)
            logger.info("Background predict hoàn thành")
        except Exception as exc:
            logger.error("Background predict thất bại: %s", exc)


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/trigger", response_model=TrainTriggerResponse)
async def trigger_train(
    background_tasks: BackgroundTasks,
    body: TrainRequest = TrainRequest(),
    tenant: TokenPayload = Depends(get_current_tenant),
) -> TrainTriggerResponse:
    """
    Trigger train thủ công cho tenant — train toàn bộ chi nhánh active.
    Chỉ OWNER hoặc ADMIN mới được gọi. Chạy background, trả về ngay.

    Returns:
        TrainTriggerResponse với status="queued"
    """
    if tenant.role not in _ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Chỉ {'/'.join(_ALLOWED_ROLES)} mới được trigger train. Role hiện tại: {tenant.role}",
        )

    target_tenant_id = body.tenant_id or tenant.tenant_id
    background_tasks.add_task(_run_train_tenant_bg, target_tenant_id)
    logger.info("Trigger train thủ công: tenant=%s by user=%s", target_tenant_id, tenant.user_id)

    return TrainTriggerResponse(
        message="Train job đã được khởi động cho tất cả chi nhánh",
        tenant_id=target_tenant_id,
        status="queued",
    )


@router.get("/status", response_model=TrainStatusResponse)
async def get_train_status(
    branch_id: str | None = Query(default=None, description="Lọc theo chi nhánh cụ thể"),
    tenant: TokenPayload = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> TrainStatusResponse:
    """
    Xem trạng thái lần train gần nhất của tenant.

    Nếu truyền branch_id → trả về status của branch đó.
    Nếu không → trả về log mới nhất bất kể branch nào.

    Returns:
        TrainStatusResponse với last_trained_at, status, mae, mape, model_exists
    """
    stmt = (
        select(TrainLog)
        .where(TrainLog.tenant_id == tenant.tenant_id)
    )
    if branch_id:
        stmt = stmt.where(TrainLog.branch_id == branch_id)

    stmt = stmt.order_by(desc(TrainLog.started_at)).limit(1)
    result = await db.execute(stmt)
    latest_log = result.scalar_one_or_none()

    # Kiểm tra file model trên disk
    exists = (
        model_io.model_exists(tenant.tenant_id, branch_id)
        if branch_id
        else bool(model_io.list_all_models())  # True nếu có ít nhất 1 branch có model
    )

    # Đọc mape từ train_metadata.json của branch (nếu có)
    mape: float | None = None
    if branch_id:
        metadata = model_io.get_train_metadata(tenant.tenant_id, branch_id)
        mape = metadata.get("mape") if metadata else None

    if latest_log is None:
        return TrainStatusResponse(
            tenant_id=tenant.tenant_id,
            last_trained_at=None,
            status=None,
            series_count=None,
            mae=None,
            mape=mape,
            model_exists=exists,
        )

    return TrainStatusResponse(
        tenant_id=tenant.tenant_id,
        last_trained_at=latest_log.finished_at or latest_log.started_at,
        status=latest_log.status,
        series_count=latest_log.series_count,
        mae=latest_log.mae,
        mape=mape,
        model_exists=exists,
    )


@router.get("/config", response_model=TrainConfigResponse)
async def get_branch_config(
    branch_id: str = Query(..., description="ID chi nhánh cần xem config"),
    tenant: TokenPayload = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> TrainConfigResponse:
    """
    Đọc config train hiện tại của chi nhánh.

    Trả về config đã lưu (hoặc defaults nếu chưa config), kèm thống kê
    số ngày data thực tế của chi nhánh để chủ quán biết đang có bao nhiêu data.

    Args:
        branch_id: UUID chi nhánh — BẮT BUỘC

    Returns:
        TrainConfigResponse với config + active_days + yearly_seasonality_auto
    """
    from app.services.data_service import get_branch_active_days, get_branch_train_config
    from app.services.train_service import YEARLY_SEASONALITY_MIN_DAYS, _auto_n_lags

    # Đọc config từ DB (hoặc defaults)
    config = await get_branch_train_config(db, tenant.tenant_id, branch_id)

    # Lấy thống kê data thực tế của branch
    activity = await get_branch_active_days(db, tenant.tenant_id, branch_id)
    active_days = activity["active_days"]

    return TrainConfigResponse(
        branch_id=branch_id,
        start_date=config["start_date"],
        n_forecasts=config["n_forecasts"],
        epochs=config["epochs"],
        weekly_seasonality=config["weekly_seasonality"],
        n_lags_auto=_auto_n_lags(active_days),
        yearly_seasonality_auto=active_days >= YEARLY_SEASONALITY_MIN_DAYS,
        active_days=active_days,
        first_order_date=activity["first_order_date"],
        last_order_date=activity["last_order_date"],
        model_exists=model_io.model_exists(tenant.tenant_id, branch_id),
    )


@router.put("/config", response_model=TrainConfigResponse)
async def update_branch_config(
    background_tasks: BackgroundTasks,
    body: TrainConfigRequest,
    branch_id: str = Query(..., description="ID chi nhánh cần cập nhật config"),
    tenant: TokenPayload = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> TrainConfigResponse:
    """
    Cập nhật config train cho chi nhánh — trigger retrain ngay.

    Chỉ OWNER hoặc ADMIN mới được thay đổi config.
    Sau khi lưu config, tự động trigger retrain background cho branch đó.

    Args:
        branch_id: UUID chi nhánh — BẮT BUỘC
        body: TrainConfigRequest — config mới

    Returns:
        TrainConfigResponse với config đã lưu + thống kê data
    """
    if tenant.role not in _ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Chỉ {'/'.join(_ALLOWED_ROLES)} mới được thay đổi config train.",
        )

    from app.services.data_service import (
        get_branch_active_days,
        upsert_branch_train_config,
    )
    from app.services.train_service import YEARLY_SEASONALITY_MIN_DAYS, _auto_n_lags

    # Lưu config mới vào DB (không lưu n_lags — tự tính khi train)
    config_dict = {
        "start_date": body.start_date,
        "n_forecasts": body.n_forecasts,
        "epochs": body.epochs,
        "weekly_seasonality": body.weekly_seasonality,
    }
    await upsert_branch_train_config(db, tenant.tenant_id, branch_id, config_dict)
    await db.commit()

    logger.info(
        "Config train đã cập nhật: tenant=%s branch=%s | n_lags=%d n_forecasts=%d epochs=%d",
        tenant.tenant_id, branch_id, body.epochs,
    )

    # Trigger retrain ngay cho branch này
    background_tasks.add_task(_run_train_branch_bg, tenant.tenant_id, branch_id)
    logger.info("Đã queue retrain: tenant=%s branch=%s", tenant.tenant_id, branch_id)

    # Lấy thống kê data để trả về response đầy đủ
    activity = await get_branch_active_days(db, tenant.tenant_id, branch_id)

    active_days = activity["active_days"]

    return TrainConfigResponse(
        branch_id=branch_id,
        start_date=body.start_date,
        n_forecasts=body.n_forecasts,
        epochs=body.epochs,
        weekly_seasonality=body.weekly_seasonality,
        n_lags_auto=_auto_n_lags(active_days),
        yearly_seasonality_auto=active_days >= YEARLY_SEASONALITY_MIN_DAYS,
        active_days=active_days,
        first_order_date=activity["first_order_date"],
        last_order_date=activity["last_order_date"],
        model_exists=model_io.model_exists(tenant.tenant_id, branch_id),
    )


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

    background_tasks.add_task(_run_predict_bg)
    logger.info("Trigger predict thủ công bởi user=%s", tenant.user_id)

    return PredictTriggerResponse(
        message="Predict job đã được khởi động",
        status="queued",
    )
