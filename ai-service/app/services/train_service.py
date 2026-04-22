"""
Train Service — logic train NeuralProphet per-branch.

Kiến trúc mới (từ migration 003):
- Mỗi chi nhánh có 1 model riêng (ingredient × ngày của branch đó)
- Config train lưu trong bảng ai_train_config — chủ quán cài qua API
- yearly_seasonality tự động bật khi branch có ≥ 730 ngày data
- TrainLog ghi per-branch (có branch_id)

Quy trình train 1 branch:
1. Load config từ ai_train_config (fallback về defaults)
2. Tính active_days để auto-detect yearly_seasonality
3. Fetch consumption data từ ngày start_date (hoặc từ đơn đầu tiên)
4. Validate, filter series đủ điều kiện
5. Train NeuralProphet Global Model cho branch đó
6. Save model → storage/models/{tenant_id}/{branch_id}/model.np
7. Ghi model_registry, TrainLog
"""

from datetime import datetime, timezone

import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.services.data_service import (
    get_active_tenants,
    get_all_active_branches,
    get_branch_active_days,
    get_branch_train_config,
    get_consumption_for_branch,
)
from app.utils import dataframe_builder
from app.utils.model_io import save_model

logger = get_logger(__name__)

# Ngưỡng tối thiểu số ngày data để train có ý nghĩa thống kê.
MIN_DAYS_REQUIRED = 30

# Ngưỡng tối thiểu số series để dùng Global Model (< ngưỡng này thì skip)
MIN_SERIES_REQUIRED = 1

# Ngưỡng số ngày để bật yearly_seasonality (cần ≥ 2 năm)
YEARLY_SEASONALITY_MIN_DAYS = 730


def _auto_n_lags(active_days: int) -> int:
    """
    Tự động tính n_lags dựa trên số ngày data của chi nhánh.

    n_lags lớn hơn → model học được pattern xa hơn trong quá khứ,
    nhưng cần đủ data để train có ý nghĩa.

    Bậc:
        < 45 ngày  → 3   (data rất ít, nhìn lại ít để tránh overfit)
        >= 45 ngày → 7   (đủ để thấy pattern hàng tuần)
        >= 90 ngày → 14  (default — thấy 2 vòng pattern 2 tuần)
        >= 180 ngày → 28 (nửa năm data — thấy được pattern tháng)

    Args:
        active_days: Số ngày chi nhánh có đơn hàng

    Returns:
        Giá trị n_lags phù hợp
    """
    if active_days >= 180:
        return 28
    if active_days >= 90:
        return 14
    if active_days >= 45:
        return 7
    return 3


def validate_training_data(df: pd.DataFrame) -> tuple[bool, str]:
    """
    Kiểm tra DataFrame đủ điều kiện train NeuralProphet.

    Args:
        df: DataFrame với cột ['ds', 'y', 'ID']
            ID dạng "s{int}" (e.g. "s42") — từ AiSeriesRegistry

    Returns:
        (True, "") nếu đủ điều kiện
        (False, lý_do) nếu không đủ — caller log và skip branch
    """
    if df.empty:
        return False, "DataFrame rỗng — không có data tiêu thụ"

    required_cols = {"ds", "y", "ID"}
    missing = required_cols - set(df.columns)
    if missing:
        return False, f"Thiếu cột: {missing}"

    if not pd.api.types.is_datetime64_any_dtype(df["ds"]):
        return False, f"Cột 'ds' phải là kiểu datetime, hiện là {df['ds'].dtype}"

    if df["y"].isna().any():
        nan_count = df["y"].isna().sum()
        return False, f"Cột 'y' có {nan_count} giá trị NaN"

    if (df["y"] < 0).any():
        neg_count = (df["y"] < 0).sum()
        return False, f"Cột 'y' có {neg_count} giá trị âm — tiêu thụ không thể âm"

    # Kiểm tra series ngắn nhất có đủ ngày không
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


def _build_neuralprophet_model(config: dict, n_lags: int, yearly_seasonality: bool):  # type: ignore[return]
    """
    Tạo NeuralProphet instance với config của branch.

    Seed đặt TRƯỚC khi khởi tạo model để weight init ổn định giữa các lần train.
    n_lags được tính tự động từ active_days — không nhận từ user config.
    yearly_seasonality được truyền vào từ auto-detection (active_days >= 730).

    Các tham số robustness cho branch mới (< 6 tháng data):
    - normalize="soft"     : scale từng series về [0,1] — fix 891× scale gap
    - loss_func="Huber"    : robust với outlier spike, không bị MSE dominated
    - ar_reg=0.01          : L2 regularization trên AR weights — tránh overfit với data ngắn
    - seasonality_reg=1.0  : smooth seasonality — không fit noise thành pattern tuần

    Args:
        config: dict với keys n_forecasts, epochs, weekly_seasonality
        n_lags: tự tính từ _auto_n_lags(active_days)
        yearly_seasonality: True nếu branch có đủ data để học pattern theo mùa
    """
    try:
        from neuralprophet import NeuralProphet  # type: ignore[import]
    except ImportError as exc:
        raise RuntimeError(
            "NeuralProphet chưa được cài. Chạy: pip install neuralprophet"
        ) from exc

    # Fix random seed TRƯỚC khi khởi tạo NeuralProphet để weight init ổn định
    # Không có seed → weights khởi tạo khác nhau → MAE dao động 0.28-0.35
    import torch, numpy as np, random
    torch.manual_seed(42)
    np.random.seed(42)
    random.seed(42)

    model = NeuralProphet(
        n_forecasts=config["n_forecasts"],
        n_lags=n_lags,                          # Auto-calculated từ active_days
        weekly_seasonality=config["weekly_seasonality"],
        daily_seasonality=False,
        yearly_seasonality=yearly_seasonality,  # Auto-detect từ active_days
        epochs=config["epochs"],
        batch_size=32,
        learning_rate=0.001,
        impute_missing=True,
        normalize="soft",                       # Scale từng series về [0,1] — fix 891× scale gap
        loss_func="Huber",                      # Robust với outlier spike — L1 cho error lớn, L2 cho nhỏ
        ar_reg=0.01,                            # L2 regularization AR weights — tránh overfit data ngắn
        seasonality_reg=1.0,                    # Smooth seasonality — không fit noise tuần thành pattern
    )

    # Thêm ngày lễ Việt Nam — BẮT BUỘC cho dự báo tại VN
    model.add_country_holidays("VN")

    logger.info(
        "NeuralProphet config: n_lags=%d | yearly=%s | epochs=%d",
        n_lags, yearly_seasonality, config["epochs"],
    )

    return model


def _filter_valid_series(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """
    Lọc bỏ các ingredient series không đủ ngày data để train.

    Series có < MIN_DAYS_REQUIRED ngày unique sẽ bị loại.
    Log rõ từng series bị skip để debug dễ hơn.

    Args:
        df: DataFrame với cột [ds, y, ID]

    Returns:
        Tuple (df_filtered, skipped_ids):
        - df_filtered: DataFrame chỉ giữ series đủ điều kiện. Rỗng nếu tất cả bị filter.
        - skipped_ids: List series_id bị skip (dạng "s{int}") — để điền vào TrainResult.
    """
    series_days = df.groupby("ID")["ds"].nunique()
    valid_ids = series_days[series_days >= MIN_DAYS_REQUIRED].index.tolist()
    skip_series = series_days[series_days < MIN_DAYS_REQUIRED]
    skipped_ids: list[str] = [str(sid) for sid in skip_series.index]

    for sid, n_days in skip_series.items():
        logger.warning("Skip %s: chỉ %d ngày (cần %d)", sid, n_days, MIN_DAYS_REQUIRED)

    if valid_ids:
        logger.info(
            "Giữ lại %d/%d series đủ điều kiện train",
            len(valid_ids), len(series_days),
        )

    return df[df["ID"].isin(valid_ids)].copy(), skipped_ids


def train_branch_model(
    df: pd.DataFrame,
    tenant_id: str,
    branch_id: str,
    config: dict,
    n_lags: int,
    yearly_seasonality: bool,
) -> dict:
    """
    Train NeuralProphet Global Model cho 1 chi nhánh (tất cả ingredient của branch).

    Args:
        df: DataFrame với cột ['ds', 'y', 'ID'] — ID = "s{int}" từ AiSeriesRegistry.
        tenant_id: ID tenant — dùng để lưu model đúng folder.
        branch_id: ID chi nhánh — mỗi branch có model riêng.
        config: dict config train (n_forecasts, epochs, weekly_seasonality, start_date).
        n_lags: tự tính từ _auto_n_lags(active_days) — không nhận từ user config.
        yearly_seasonality: True khi branch có ≥ 730 ngày data.

    Returns:
        dict với keys: mae, mape, model_path, series_count, series_skipped

    Raises:
        ValueError: Data không hợp lệ sau filter
        RuntimeError: Train thất bại
    """
    # Bước 1: Lọc series đủ điều kiện — nhận cả list series bị skip
    df, series_skipped = _filter_valid_series(df)

    is_valid, reason = validate_training_data(df)
    if not is_valid:
        raise ValueError(f"Data không đủ điều kiện train: {reason}")

    n_series = df["ID"].nunique()
    n_rows = len(df)

    # Adaptive epochs: branch mới < 90 ngày → giảm epochs tránh overfit
    # Với ít data, 100 epochs có thể học noise thành pattern giả
    data_days = int(df["ds"].nunique())
    if data_days < 90 and config["epochs"] > 50:
        config = {**config, "epochs": 50}
        logger.info(
            "Adaptive epochs: data_days=%d < 90 → giảm epochs xuống 50 để tránh overfit",
            data_days,
        )

    logger.info(
        "Train branch: tenant=%s branch=%s | %d series | %d rows | n_lags=%d | yearly=%s | epochs=%d | data_days=%d",
        tenant_id, branch_id, n_series, n_rows, n_lags, yearly_seasonality,
        config["epochs"], data_days,
    )

    # Bước 2: Clip outlier trước khi train — giảm ảnh hưởng spike cực đoan
    df_clean, clip_report = dataframe_builder.clip_outliers_per_series(df)
    if clip_report:
        logger.info(
            "Đã clip outliers: %d series bị ảnh hưởng",
            len(clip_report),
        )
        for sid, info in clip_report.items():
            logger.debug(
                "  %s: clip %d rows (max %s → %s)",
                sid,
                info["clipped_rows"],
                info["original_max"],
                info["upper_bound"],
            )

    # Bước 3: Tạo model với config của branch
    model = _build_neuralprophet_model(config, n_lags, yearly_seasonality)

    # Bước 4: Train — NeuralProphet tự detect Global Model khi có cột 'ID'
    try:
        metrics = model.fit(df_clean, freq="D")
    except Exception as exc:
        raise RuntimeError(f"Train thất bại: {exc}") from exc

    # Bước 5a: Lấy MAE từ metrics cuối epoch
    mae: float | None = None
    try:
        if metrics is not None and not metrics.empty and "MAE" in metrics.columns:
            mae = float(metrics["MAE"].iloc[-1])
            logger.info("Train xong: MAE=%.4f", mae)
    except Exception:
        logger.warning("Không lấy được MAE từ metrics")

    # Bước 5b: Tính metrics dự báo từ in-sample predictions
    # 3 metrics song song:
    # - WAPE (primary): sum|error| / sum(actual) — metric chuẩn cho intermittent demand
    # - MAPE (active): chỉ tính trên ngày y>0 — loại bỏ inflate từ zero-days
    # - MAPE (all): công thức cũ giữ để so sánh backward-compatible
    mape: float | None = None
    wape: float | None = None
    try:
        pred_df = model.predict(df_clean)
        if "yhat1" in pred_df.columns and "y" in pred_df.columns:
            valid = pred_df.dropna(subset=["yhat1", "y"])
            if not valid.empty:
                abs_errors = (valid["yhat1"] - valid["y"]).abs()
                total_actual = valid["y"].sum()

                # WAPE — metric chính cho bài toán kho có intermittent demand
                # WAPE = tổng sai lệch / tổng tiêu thụ thực
                if total_actual > 0:
                    wape = float(abs_errors.sum() / total_actual * 100)

                # MAPE trên tất cả ngày (kể cả y=0) — backward-compatible
                mape_all = float(
                    (abs_errors / (valid["y"] + 1)).mean() * 100
                )

                # MAPE chỉ trên ngày có tiêu thụ (y > 0)
                active = valid[valid["y"] > 0]
                mape_active: float | None = None
                if not active.empty:
                    mape_active = float(
                        ((active["yhat1"] - active["y"]).abs() / active["y"]).mean() * 100
                    )

                # WAPE là metric chính lưu vào DB
                mape = wape if wape is not None else mape_all

                logger.info(
                    "Metrics: WAPE=%.2f%% | MAPE(y>0)=%.2f%% | MAPE(all)=%.2f%% | active=%d/%d rows",
                    wape or 0,
                    mape_active or 0,
                    mape_all,
                    len(active) if not active.empty else 0,
                    len(valid),
                )
    except Exception:
        logger.warning("Không tính được metrics dự báo — bỏ qua")

    # Bước 6: Lưu model kèm config (bao gồm n_lags đã dùng) để validate khi predict
    train_config_to_save = {**config, "n_lags": n_lags, "yearly_seasonality": yearly_seasonality}
    model_path = save_model(
        model,
        tenant_id,
        branch_id,
        series_count=n_series,
        mae=mae,
        mape=mape,
        config=train_config_to_save,
    )
    logger.info("Model đã lưu: %s", model_path)

    return {
        "mae": mae,
        "mape": mape,
        "model_path": str(model_path),
        "series_count": n_series,
        "series_skipped": series_skipped,
    }


async def _register_branch_model(
    db: AsyncSession,
    tenant_id: str,
    branch_id: str,
    result: dict,
) -> None:
    """
    Ghi thông tin model vừa train vào bảng model_registry.

    Deactivate tất cả model cũ của (tenant, branch) trước khi insert record mới.
    Đảm bảo mỗi (tenant, branch) chỉ có 1 model is_active=True tại mọi thời điểm.

    Args:
        db: AsyncSession
        tenant_id: ID tenant
        branch_id: ID chi nhánh
        result: dict từ train_branch_model() — có mae, mape, model_path, series_count
    """
    from sqlalchemy import text as sa_text
    from app.models.model_registry import ModelRegistry

    # Deactivate model cũ của branch này
    await db.execute(
        sa_text("""
            UPDATE model_registry
            SET is_active = false
            WHERE tenant_id = :tenant_id AND branch_id = :branch_id
        """),
        {"tenant_id": tenant_id, "branch_id": branch_id},
    )

    # Insert model mới
    new_record = ModelRegistry(
        tenant_id=tenant_id,
        branch_id=branch_id,
        model_path=result["model_path"],
        trained_at=datetime.now(timezone.utc),
        series_count=result["series_count"],
        mae=result["mae"],
        mape=result.get("mape"),
        is_active=True,
    )
    db.add(new_record)
    logger.info(
        "model_registry: ghi record mới | tenant=%s branch=%s | series=%s mae=%s mape=%s",
        tenant_id, branch_id, result["series_count"], result["mae"], result.get("mape"),
    )


async def run_train_for_branch(
    db: AsyncSession,
    tenant_id: str,
    branch_id: str,
    trigger_type: str = "manual",
) -> dict:
    """
    Quy trình train đầy đủ cho 1 chi nhánh: load config → fetch data → train → ghi log.

    Args:
        db: AsyncSession
        tenant_id: ID tenant
        branch_id: ID chi nhánh cần train
        trigger_type: "scheduled" | "manual"

    Returns:
        dict với status, mae, mape, series_count, model_path, error_message
    """
    from app.models.train_log import TrainLog

    started_at = datetime.now(timezone.utc)

    # Ghi log "running" trước khi train
    train_log = TrainLog(
        tenant_id=tenant_id,
        branch_id=branch_id,
        started_at=started_at,
        status="running",
        trigger_type=trigger_type,
    )
    db.add(train_log)
    await db.flush()

    try:
        # Bước 1: Load config của branch (fallback về defaults nếu chưa config)
        config = await get_branch_train_config(db, tenant_id, branch_id)

        # Bước 2: Kiểm tra active_days để auto-detect n_lags và yearly_seasonality
        activity = await get_branch_active_days(db, tenant_id, branch_id)
        active_days = activity["active_days"]
        n_lags = _auto_n_lags(active_days)
        yearly_seasonality = active_days >= YEARLY_SEASONALITY_MIN_DAYS

        logger.info(
            "Branch %s: active_days=%d → n_lags=%d | yearly_seasonality=%s",
            branch_id, active_days, n_lags, yearly_seasonality,
        )

        # Bước 3: Lấy data tiêu thụ (từ start_date hoặc từ đơn đầu tiên)
        df = await get_consumption_for_branch(
            db, tenant_id, branch_id, config.get("start_date")
        )

        if df.empty:
            raise ValueError(
                f"Không có data tiêu thụ cho branch {branch_id}"
            )

        # Bước 4: Train model
        result = train_branch_model(df, tenant_id, branch_id, config, n_lags, yearly_seasonality)

        # Bước 5: Ghi vào model_registry
        await _register_branch_model(db, tenant_id, branch_id, result)

        # Bước 6: Cập nhật log thành công
        train_log.status = "success"
        train_log.finished_at = datetime.now(timezone.utc)
        train_log.mae = result["mae"]
        train_log.series_count = result["series_count"]
        await db.commit()

        logger.info(
            "Train THÀNH CÔNG: tenant=%s branch=%s | MAE=%s MAPE=%s | %d series",
            tenant_id, branch_id,
            f"{result['mae']:.4f}" if result["mae"] is not None else "N/A",
            f"{result['mape']:.2f}%" if result.get("mape") is not None else "N/A",
            result["series_count"],
        )
        return {"status": "success", **result, "error_message": None}

    except Exception as exc:
        train_log.status = "failed"
        train_log.finished_at = datetime.now(timezone.utc)
        train_log.error_message = str(exc)
        await db.commit()

        logger.error("Train THẤT BẠI: tenant=%s branch=%s | %s", tenant_id, branch_id, exc)
        return {
            "status": "failed",
            "mae": None,
            "mape": None,
            "series_count": None,
            "model_path": None,
            "series_skipped": [],
            "error_message": str(exc),
        }


async def run_train_for_tenant(
    db: AsyncSession,
    tenant_id: str,
    trigger_type: str = "scheduled",
) -> list[dict]:
    """
    Train tất cả chi nhánh active của 1 tenant — mỗi branch train riêng.

    Args:
        db: AsyncSession
        tenant_id: ID tenant cần train
        trigger_type: "scheduled" | "manual"

    Returns:
        List[dict] — kết quả train mỗi branch (có key branch_id, status, mae, ...)
    """
    branches = await get_all_active_branches(db, tenant_id)

    if not branches:
        logger.warning("Tenant %s không có chi nhánh active nào", tenant_id)
        return []

    logger.info(
        "Bắt đầu train tenant=%s | %d chi nhánh", tenant_id, len(branches)
    )

    results: list[dict] = []
    for branch in branches:
        branch_id: str = branch["id"]
        logger.info("--- Train branch: %s ---", branch_id)
        result = await run_train_for_branch(db, tenant_id, branch_id, trigger_type)
        results.append({"branch_id": branch_id, **result})

    success = sum(1 for r in results if r["status"] == "success")
    logger.info(
        "Tenant %s: %d/%d branch train thành công",
        tenant_id, success, len(results),
    )
    return results


async def run_train_all_tenants(db: AsyncSession) -> list[dict]:
    """
    Train cho tất cả tenant active — dùng trong cron job Chủ nhật 2:00 AM.

    Returns:
        List[dict] flatten — mỗi item là kết quả 1 branch (có key tenant_id, branch_id, status, ...)
    """
    tenant_ids = await get_active_tenants(db)
    logger.info("Bắt đầu train tất cả %d tenant", len(tenant_ids))

    all_results: list[dict] = []
    for tenant_id in tenant_ids:
        logger.info("=== Tenant: %s ===", tenant_id)
        tenant_results = await run_train_for_tenant(db, tenant_id, trigger_type="scheduled")
        for r in tenant_results:
            all_results.append({"tenant_id": tenant_id, **r})

    success = sum(1 for r in all_results if r["status"] == "success")
    logger.info(
        "Hoàn thành train: %d/%d branch thành công | %d tenant",
        success, len(all_results), len(tenant_ids),
    )
    return all_results
