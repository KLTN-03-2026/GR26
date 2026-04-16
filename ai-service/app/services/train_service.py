"""
Train Service — logic train Global Model NeuralProphet.

Quy trình:
1. Nhận DataFrame tổng hợp từ data_service (tất cả series của 1 tenant)
2. Validate data
3. Train NeuralProphet Global Model
4. Save model vào storage/models/{tenant_id}/global_model.np
5. Ghi TrainLog vào DB
6. Trả về metrics (MAE)

Global Model strategy: train 1 model duy nhất cho toàn bộ
ingredient × branch của 1 tenant — hiệu quả hơn N model riêng lẻ
khi có nhiều series ngắn.
"""

from datetime import datetime, timezone

import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.services.data_service import (
    get_active_tenants,            # alias của get_all_active_tenants
    get_all_consumption_for_tenant,
)
from app.utils.model_io import save_model

logger = get_logger(__name__)

# Ngưỡng tối thiểu số ngày data để train có ý nghĩa thống kê
MIN_DAYS_REQUIRED = 30

# Ngưỡng tối thiểu số series để dùng Global Model (< ngưỡng này thì skip)
MIN_SERIES_REQUIRED = 1


def validate_training_data(df: pd.DataFrame) -> tuple[bool, str]:
    """
    Kiểm tra DataFrame đủ điều kiện train NeuralProphet.

    Args:
        df: DataFrame với cột ['ds', 'y', 'ID']
            ID dạng "s{int}" (e.g. "s42") — từ AiSeriesRegistry

    Returns:
        (True, "") nếu đủ điều kiện
        (False, lý_do) nếu không đủ — cần fallback hoặc skip
    """
    if df.empty:
        return False, "DataFrame rỗng — không có data tiêu thụ"

    required_cols = {"ds", "y", "ID"}
    missing = required_cols - set(df.columns)
    if missing:
        return False, f"Thiếu cột: {missing}"

    # Pandas 2.x dùng datetime64[ns], pandas 3.x dùng datetime64[us] — đều chấp nhận
    if not pd.api.types.is_datetime64_any_dtype(df["ds"]):
        return False, f"Cột 'ds' phải là kiểu datetime, hiện là {df['ds'].dtype}"

    if df["y"].isna().any():
        nan_count = df["y"].isna().sum()
        return False, f"Cột 'y' có {nan_count} giá trị NaN"

    if (df["y"] < 0).any():
        neg_count = (df["y"] < 0).sum()
        return False, f"Cột 'y' có {neg_count} giá trị âm — tiêu thụ không thể âm"

    # Kiểm tra số ngày unique của series có ít data nhất
    min_days = df.groupby("ID")["ds"].nunique().min()
    if min_days < MIN_DAYS_REQUIRED:
        return False, (
            f"Series ngắn nhất chỉ có {min_days} ngày — "
            f"cần ít nhất {MIN_DAYS_REQUIRED} ngày"
        )

    n_series = df["ID"].nunique()
    if n_series < MIN_SERIES_REQUIRED:
        return False, f"Chỉ có {n_series} series — không đủ để train"

    return True, ""


def _build_neuralprophet_model():  # type: ignore[return]
    """
    Tạo NeuralProphet instance với config chuẩn cho bài toán kho F&B.

    Config:
    - n_forecasts=7: Dự báo 7 ngày tới
    - n_lags=14: Học pattern từ 14 ngày gần nhất
    - weekly_seasonality=True: Quán cafe có pattern cuối tuần rõ
    - add_country_holidays("VN"): Tết, 30/4, 1/5...
    """
    try:
        from neuralprophet import NeuralProphet  # type: ignore[import]
    except ImportError as exc:
        raise RuntimeError(
            "NeuralProphet chưa được cài. Chạy: pip install neuralprophet"
        ) from exc

    model = NeuralProphet(
        n_forecasts=settings.np_n_forecasts,   # Dự báo 7 ngày tới
        n_lags=settings.np_n_lags,             # Nhìn lại 14 ngày để học pattern
        weekly_seasonality=True,               # Pattern cuối tuần rõ ở F&B
        daily_seasonality=False,               # Data theo ngày — không cần
        yearly_seasonality=False,              # Cần ≥ 2 năm data — chưa đủ
        epochs=settings.np_epochs,
        batch_size=32,
        learning_rate=0.001,
        impute_missing=True,                   # Tự điền NaN thay vì drop row
    )
    # Fix random seed để MAE ổn định giữa các lần train
    import torch, numpy as np, random
    torch.manual_seed(42)
    np.random.seed(42)
    random.seed(42)

    # Thêm ngày lễ Việt Nam — BẮT BUỘC cho dự báo tại VN
    model.add_country_holidays("VN")

    return model


def _filter_valid_series(df: pd.DataFrame) -> pd.DataFrame:
    """
    Lọc bỏ các series không đủ ngày data để train.

    Series có < MIN_DAYS_REQUIRED ngày unique sẽ bị loại.
    Log rõ từng series bị skip để debug dễ hơn.

    Args:
        df: DataFrame với cột [ds, y, ID]

    Returns:
        DataFrame chỉ giữ series đủ điều kiện. Rỗng nếu tất cả bị filter.
    """
    series_days = df.groupby("ID")["ds"].nunique()
    valid_ids = series_days[series_days >= MIN_DAYS_REQUIRED].index.tolist()
    skip_ids = series_days[series_days < MIN_DAYS_REQUIRED]

    for sid, n_days in skip_ids.items():
        logger.warning("Skip %s: chỉ %d ngày (cần %d)", sid, n_days, MIN_DAYS_REQUIRED)

    if valid_ids:
        logger.info("Giữ lại %d/%d series đủ điều kiện train", len(valid_ids), len(series_days))

    return df[df["ID"].isin(valid_ids)].copy()


def train_global_model(df: pd.DataFrame, tenant_id: str) -> dict:
    """
    Train NeuralProphet Global Model cho toàn bộ ingredient × branch của tenant.

    Args:
        df: DataFrame với cột ['ds', 'y', 'ID'] đã validate.
            ID = "s{int}" (e.g. "s42") — từ AiSeriesRegistry.
        tenant_id: ID tenant — dùng để lưu model đúng folder.

    Returns:
        dict với keys: mae (float | None), model_path (str), series_count (int)

    Raises:
        ValueError: Data không hợp lệ
        RuntimeError: Train thất bại
    """
    # Bước 1: Lọc series đủ điều kiện trước khi validate toàn bộ
    df = _filter_valid_series(df)

    is_valid, reason = validate_training_data(df)
    if not is_valid:
        raise ValueError(f"Data không đủ điều kiện train: {reason}")

    n_series = df["ID"].nunique()
    n_rows = len(df)
    logger.info(
        "Bắt đầu train: tenant=%s | %d series | %d rows",
        tenant_id, n_series, n_rows,
    )

    # Bước 2: Tạo model
    model = _build_neuralprophet_model()

    # Bước 3: Train — NeuralProphet tự detect Global Model khi có cột 'ID'
    try:
        metrics = model.fit(df, freq="D")
    except Exception as exc:
        raise RuntimeError(f"Train thất bại: {exc}") from exc

    # Bước 4: Lấy MAE từ metrics cuối epoch
    mae: float | None = None
    try:
        # NeuralProphet trả về DataFrame metrics với cột 'MAE'
        if metrics is not None and not metrics.empty and "MAE" in metrics.columns:
            mae = float(metrics["MAE"].iloc[-1])
            logger.info("Train xong: MAE=%.4f", mae)
    except Exception:
        logger.warning("Không lấy được MAE từ metrics")

    # Bước 5: Lưu model
    model_path = save_model(model, tenant_id, series_count=n_series)
    logger.info("Model đã lưu: %s", model_path)

    return {
        "mae": mae,
        "model_path": str(model_path),
        "series_count": n_series,
    }


async def _register_model(db: AsyncSession, tenant_id: str, result: dict) -> None:
    """
    Ghi thông tin model vừa train vào bảng model_registry.

    Deactivate tất cả model cũ của tenant trước khi insert record mới.
    Đảm bảo mỗi tenant chỉ có 1 model is_active=True tại mọi thời điểm.

    Args:
        db: AsyncSession
        tenant_id: ID tenant
        result: dict từ train_global_model() — có mae, model_path, series_count
    """
    from sqlalchemy import text as sa_text
    from app.models.model_registry import ModelRegistry

    # Deactivate tất cả model cũ của tenant
    await db.execute(
        sa_text("UPDATE model_registry SET is_active = false WHERE tenant_id = :tenant_id"),
        {"tenant_id": tenant_id},
    )

    # Insert model mới với is_active=True
    new_record = ModelRegistry(
        tenant_id=tenant_id,
        model_path=result["model_path"],
        trained_at=datetime.now(timezone.utc),
        series_count=result["series_count"],
        mae=result["mae"],
        is_active=True,
    )
    db.add(new_record)
    logger.info(
        "model_registry: ghi record mới cho tenant=%s | series=%s | mae=%s",
        tenant_id, result["series_count"], result["mae"],
    )


async def run_train_for_tenant(
    db: AsyncSession,
    tenant_id: str,
    trigger_type: str = "scheduled",
) -> dict:
    """
    Quy trình train đầy đủ cho 1 tenant: lấy data → train → ghi log.

    Dùng get_all_consumption_for_tenant() để lấy toàn bộ data của tenant
    (tất cả ingredient × branch) và upsert vào consumption_history trước khi train.

    Args:
        db: AsyncSession
        tenant_id: ID tenant cần train
        trigger_type: "scheduled" | "manual"

    Returns:
        dict với status, mae, series_count, model_path, error_message
    """
    from app.models.train_log import TrainLog

    started_at = datetime.now(timezone.utc)

    # Ghi log "running" trước khi train
    train_log = TrainLog(
        tenant_id=tenant_id,
        started_at=started_at,
        status="running",
        trigger_type=trigger_type,
    )
    db.add(train_log)
    await db.flush()  # Lấy id nhưng chưa commit

    try:
        # Bước 1: Lấy toàn bộ data tiêu thụ của tenant (tất cả branch)
        # get_all_consumption_for_tenant tự nhóm theo (ingredient × branch),
        # map series_id qua AiSeriesRegistry và upsert vào consumption_history
        combined_df = await get_all_consumption_for_tenant(db, tenant_id, days_back=180)

        if combined_df.empty:
            raise ValueError(
                f"Không có data tiêu thụ nào cho tenant {tenant_id} trong 180 ngày"
            )

        # Bước 2: Train Global Model
        result = train_global_model(combined_df, tenant_id)

        # Bước 3: Ghi vào model_registry — deactivate model cũ, insert model mới
        await _register_model(db, tenant_id, result)

        # Bước 4: Cập nhật log thành công
        train_log.status = "success"
        train_log.finished_at = datetime.now(timezone.utc)
        train_log.mae = result["mae"]
        train_log.series_count = result["series_count"]
        await db.commit()

        logger.info(
            "Train THÀNH CÔNG: tenant=%s | MAE=%s | %d series",
            tenant_id,
            f"{result['mae']:.4f}" if result["mae"] is not None else "N/A",
            result["series_count"],
        )
        return {"status": "success", **result, "error_message": None}

    except Exception as exc:
        # Ghi log thất bại
        train_log.status = "failed"
        train_log.finished_at = datetime.now(timezone.utc)
        train_log.error_message = str(exc)
        await db.commit()

        logger.error("Train THẤT BẠI: tenant=%s | %s", tenant_id, exc)
        return {
            "status": "failed",
            "mae": None,
            "series_count": None,
            "model_path": None,
            "error_message": str(exc),
        }


async def run_train_all_tenants(db: AsyncSession) -> list[dict]:
    """
    Train cho tất cả tenant active — dùng trong cron job Chủ nhật 2:00 AM.

    Returns:
        List kết quả train mỗi tenant
    """
    tenant_ids = await get_active_tenants(db)
    logger.info("Bắt đầu train tất cả %d tenant", len(tenant_ids))

    results = []
    for tenant_id in tenant_ids:
        logger.info("--- Train tenant: %s ---", tenant_id)
        result = await run_train_for_tenant(db, tenant_id, trigger_type="scheduled")
        results.append({"tenant_id": tenant_id, **result})

    success = sum(1 for r in results if r["status"] == "success")
    failed = len(results) - success
    logger.info(
        "Hoàn thành train: %d/%d tenant thành công, %d thất bại",
        success, len(results), failed,
    )
    return results
