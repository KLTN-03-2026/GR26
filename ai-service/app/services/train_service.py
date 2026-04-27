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
from app.utils.model_io import save_model, update_train_metadata

logger = get_logger(__name__)

# Ngưỡng tối thiểu số ngày data theo kỳ dự báo.
# Quy tắc: min_data ≈ n_lags × 5~6 để có đủ training sample, tránh overfit.
# FE dùng giá trị này để hiển thị progress bar "chi nhánh đủ điều kiện AI chưa".
MIN_DAYS_BY_FORECAST: dict[int, int] = {
    7:  90,   # n_lags=14  → 14×6=84  → làm tròn 90
    14: 150,  # n_lags=28  → 28×5=140 → làm tròn 150
    21: 180,  # n_lags=28  → 28×6=168 → làm tròn 180
}
# Fallback khi n_forecasts không nằm trong bảng trên
MIN_DAYS_REQUIRED = 90


def get_min_days_required(n_forecasts: int) -> int:
    """
    Trả về số ngày data tối thiểu cần có để train với kỳ dự báo n_forecasts.

    Càng dự báo xa → n_lags lớn hơn → cần nhiều data hơn để có đủ training sample.
    Nếu n_forecasts không có trong bảng, fallback về MIN_DAYS_REQUIRED (90).

    Args:
        n_forecasts: Số ngày dự báo (thường là 7, 14, hoặc 21)

    Returns:
        Số ngày tối thiểu cần có đơn hàng
    """
    return MIN_DAYS_BY_FORECAST.get(n_forecasts, MIN_DAYS_REQUIRED)

# Ngưỡng tối thiểu số series để dùng Global Model (< ngưỡng này thì skip)
MIN_SERIES_REQUIRED = 1

# Ngưỡng số ngày để bật yearly_seasonality (cần ≥ 2 năm)
YEARLY_SEASONALITY_MIN_DAYS = 730


def _auto_n_lags(active_days: int) -> int:
    """
    Tự động tính n_lags dựa trên số ngày data của chi nhánh.

    n_lags lớn hơn → model học được pattern xa hơn trong quá khứ,
    nhưng cần đủ data để train có ý nghĩa.

    Quy tắc: n_lags không nên vượt quá 25% tổng số ngày data.
    Nếu không, model sẽ thiếu sample để học → overfit.

    Bậc:
        < 45 ngày   →  3  (data rất ít, nhìn lại ít để tránh overfit)
        >= 45 ngày  →  7  (đủ để thấy pattern hàng tuần)
        >= 90 ngày  → 14  (default — thấy 2 vòng pattern 2 tuần)
        >= 180 ngày → 28  (nửa năm data — thấy được pattern tháng)
        >= 365 ngày → 90  (1 năm+ data — học được pattern theo quý / mùa vụ)

    Args:
        active_days: Số ngày chi nhánh có đơn hàng

    Returns:
        Giá trị n_lags phù hợp
    """
    if active_days >= 365:
        return 90
    if active_days >= 180:
        return 28
    if active_days >= 90:
        return 14
    if active_days >= 45:
        return 7
    return 3


def validate_training_data(df: pd.DataFrame, min_days: int = MIN_DAYS_REQUIRED) -> tuple[bool, str]:
    """
    Kiểm tra DataFrame đủ điều kiện train NeuralProphet.

    Args:
        df: DataFrame với cột ['ds', 'y', 'ID']
            ID dạng "s{int}" (e.g. "s42") — từ AiSeriesRegistry
        min_days: Số ngày tối thiểu mỗi series cần có — tính từ get_min_days_required(n_forecasts)

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
    min_series_days = df.groupby("ID")["ds"].nunique().min()
    if min_series_days < min_days:
        return False, (
            f"Series ngắn nhất chỉ có {min_series_days} ngày — "
            f"cần ít nhất {min_days} ngày với kỳ dự báo này"
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
        quantiles=[0.1, 0.9],                   # Khoảng tin cậy 80% — lower/upper bound cho FE chart
    )

    # Thêm ngày lễ Việt Nam — BẮT BUỘC cho dự báo tại VN
    model.add_country_holidays("VN")

    logger.info(
        "NeuralProphet config: n_lags=%d | yearly=%s | epochs=%d",
        n_lags, yearly_seasonality, config["epochs"],
    )

    return model


def _build_neuralprophet_model_weekly(epochs: int = 150):  # type: ignore[return]
    """
    Tạo NeuralProphet instance cho weekly model (intermittent/sparse series).

    Cấu hình tối ưu cho dữ liệu theo tuần:
    - n_forecasts=4: dự báo 4 tuần tới (~1 tháng)
    - n_lags=8: nhìn lại 8 tuần (~2 tháng) để học pattern
    - weekly_seasonality=False: data đã là weekly — không có trong-tuần variation
    - yearly_seasonality=False: cần ≥ 104 tuần (2 năm) mới có ý nghĩa
    - normalize="soft": scale series về [0,1] — cùng lý do với daily model
    - loss_func="Huber": robust với spike trong weekly data

    Args:
        epochs: Số epoch train (mặc định 150)
    """
    try:
        from neuralprophet import NeuralProphet  # type: ignore[import]
    except ImportError as exc:
        raise RuntimeError("NeuralProphet chưa được cài") from exc

    import torch, numpy as np, random
    torch.manual_seed(42)
    np.random.seed(42)
    random.seed(42)

    model = NeuralProphet(
        n_forecasts=4,                  # Dự báo 4 tuần tới
        n_lags=8,                       # Nhìn lại 8 tuần (~2 tháng)
        weekly_seasonality=False,       # Data đã là weekly — không có pattern trong tuần
        daily_seasonality=False,
        yearly_seasonality=False,       # Cần ≥ 104 tuần mới học được
        epochs=epochs,
        batch_size=32,
        learning_rate=0.001,
        impute_missing=True,
        normalize="soft",
        loss_func="Huber",
        ar_reg=0.01,
        seasonality_reg=1.0,
        quantiles=[0.1, 0.9],           # Khoảng tin cậy 80% cho weekly series
    )

    # Thêm ngày lễ Việt Nam — vẫn ảnh hưởng đến tiêu thụ dù data theo tuần
    model.add_country_holidays("VN")

    logger.info("NeuralProphet weekly config: n_lags=8 | n_forecasts=4 | epochs=%d", epochs)
    return model


def _filter_valid_series(df: pd.DataFrame, min_days: int = MIN_DAYS_REQUIRED) -> tuple[pd.DataFrame, list[str]]:
    """
    Lọc bỏ các ingredient series không đủ ngày data để train.

    Series có < min_days ngày unique sẽ bị loại.
    Log rõ từng series bị skip để debug dễ hơn.

    Args:
        df: DataFrame với cột [ds, y, ID]
        min_days: Ngưỡng tối thiểu số ngày — lấy từ get_min_days_required(n_forecasts)

    Returns:
        Tuple (df_filtered, skipped_ids):
        - df_filtered: DataFrame chỉ giữ series đủ điều kiện. Rỗng nếu tất cả bị filter.
        - skipped_ids: List series_id bị skip (dạng "s{int}") — để điền vào TrainResult.
    """
    series_days = df.groupby("ID")["ds"].nunique()
    valid_ids = series_days[series_days >= min_days].index.tolist()
    skip_series = series_days[series_days < min_days]
    skipped_ids: list[str] = [str(sid) for sid in skip_series.index]

    for sid, n_days in skip_series.items():
        logger.warning("Skip %s: chỉ %d ngày (cần %d)", sid, n_days, min_days)

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
    weather_df: pd.DataFrame | None = None,
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
        weather_df: DataFrame [ds, temperature, precipitation] từ weather cache.
                    None → không dùng weather regressor (bình thường).

    Returns:
        dict với keys: mae, mape, model_path, series_count, series_skipped

    Raises:
        ValueError: Data không hợp lệ sau filter
        RuntimeError: Train thất bại
    """
    # Bước 1: Lọc series đủ điều kiện — ngưỡng min_days theo n_forecasts
    min_days = get_min_days_required(config["n_forecasts"])
    df, series_skipped = _filter_valid_series(df, min_days=min_days)

    is_valid, reason = validate_training_data(df, min_days=min_days)
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

    # Bước 2.5: Phân loại demand pattern → tách regular / intermittent / sparse
    groups = dataframe_builder.split_by_demand_pattern(df_clean)
    regular_ids = set(groups["regular"]["ID"].unique()) if not groups["regular"].empty else set()
    intermittent_ids = set(groups["intermittent"]["ID"].unique()) if not groups["intermittent"].empty else set()
    sparse_ids = set(groups["sparse"]["ID"].unique()) if not groups["sparse"].empty else set()

    logger.info(
        "Pattern: %d regular (daily) | %d intermittent (weekly) | %d sparse (weekly)",
        len(regular_ids), len(intermittent_ids), len(sparse_ids),
    )

    # ── Bước 3: Train daily model (regular series) ──────────────────────────
    mae: float | None = None
    mape: float | None = None
    model_path_daily: str | None = None

    if not groups["regular"].empty:
        df_regular = groups["regular"]

        # Merge weather regressors nếu có đủ data (chỉ cho daily model)
        use_weather = False
        if weather_df is not None and not weather_df.empty:
            df_merged = df_regular.merge(
                weather_df[["ds", "temperature", "precipitation"]],
                on="ds",
                how="left",
            )
            weather_coverage = df_merged["temperature"].notna().mean()
            if weather_coverage >= 0.7:
                median_temp = float(df_merged["temperature"].median())
                df_merged["temperature"] = df_merged["temperature"].fillna(median_temp)
                df_merged["precipitation"] = df_merged["precipitation"].fillna(0.0)
                df_regular = df_merged
                use_weather = True
                logger.info(
                    "Tích hợp weather regressors (daily): coverage=%.0f%% | median_temp=%.1f°C",
                    weather_coverage * 100, median_temp,
                )
            else:
                logger.warning("Weather coverage %.0f%% < 70%% — bỏ qua weather regressor", weather_coverage * 100)

        model_daily = _build_neuralprophet_model(config, n_lags, yearly_seasonality)
        if use_weather:
            model_daily.add_future_regressor("temperature")
            model_daily.add_future_regressor("precipitation")

        try:
            metrics_daily = model_daily.fit(df_regular, freq="D")
            if metrics_daily is not None and not metrics_daily.empty and "MAE" in metrics_daily.columns:
                mae = float(metrics_daily["MAE"].iloc[-1])
        except Exception as exc:
            raise RuntimeError(f"Train daily model thất bại: {exc}") from exc

        # WAPE cho daily model
        try:
            pred_df = model_daily.predict(df_regular)
            if "yhat1" in pred_df.columns and "y" in pred_df.columns:
                valid = pred_df.dropna(subset=["yhat1", "y"])
                if not valid.empty:
                    abs_errors = (valid["yhat1"] - valid["y"]).abs()
                    total_actual = valid["y"].sum()
                    wape_val = float(abs_errors.sum() / total_actual * 100) if total_actual > 0 else None
                    mape_all = float((abs_errors / (valid["y"] + 1)).mean() * 100)
                    active = valid[valid["y"] > 0]
                    mape_active = float(((active["yhat1"] - active["y"]).abs() / active["y"]).mean() * 100) if not active.empty else None
                    mape = wape_val if wape_val is not None else mape_all
                    logger.info(
                        "Daily metrics: WAPE=%.2f%% | MAPE(y>0)=%.2f%% | MAPE(all)=%.2f%%",
                        wape_val or 0, mape_active or 0, mape_all,
                    )
        except Exception:
            logger.warning("Không tính được metrics daily — bỏ qua")

        daily_config = {
            **config,
            "n_lags": n_lags,
            "yearly_seasonality": yearly_seasonality,
            "use_weather_regressor": use_weather,
        }
        path_obj = save_model(
            model_daily, tenant_id, branch_id,
            series_count=len(regular_ids),
            mae=mae, mape=mape,
            config=daily_config,
            model_type="daily",
        )
        model_path_daily = str(path_obj)

    # ── Bước 4: Train weekly model (intermittent + sparse) ──────────────────
    model_path_weekly: str | None = None
    weekly_ids = intermittent_ids | sparse_ids

    if weekly_ids:
        df_weekly_input = pd.concat(
            [g for g in [groups["intermittent"], groups["sparse"]] if not g.empty],
            ignore_index=True,
        )
        df_weekly = dataframe_builder.aggregate_to_weekly(df_weekly_input)

        if not df_weekly.empty:
            # Kiểm tra tuần tối thiểu (≥ 4 tuần để train có ý nghĩa)
            min_weeks = int(df_weekly.groupby("ID")["ds"].nunique().min())
            if min_weeks >= 4:
                weekly_epochs = config.get("epochs", 150)
                model_weekly = _build_neuralprophet_model_weekly(epochs=weekly_epochs)

                try:
                    model_weekly.fit(df_weekly, freq="W-MON")
                except Exception as exc:
                    logger.warning("Train weekly model thất bại: %s — bỏ qua", exc)
                    model_weekly = None

                if model_weekly is not None:
                    weekly_config = {
                        "n_forecasts": 4,
                        "n_lags": 8,
                        "model_freq": "W-MON",
                        "series_ids": list(weekly_ids),
                    }
                    path_obj_w = save_model(
                        model_weekly, tenant_id, branch_id,
                        series_count=len(weekly_ids),
                        config=weekly_config,
                        model_type="weekly",
                    )
                    model_path_weekly = str(path_obj_w)
            else:
                logger.warning(
                    "Weekly series ngắn nhất chỉ có %d tuần (cần ≥ 4) — bỏ qua weekly model",
                    min_weeks,
                )

    # Bước 5: Cập nhật metadata với series_classification + model_paths
    series_classification = {
        "regular":      list(regular_ids),
        "intermittent": list(intermittent_ids),
        "sparse":       list(sparse_ids),
    }
    update_train_metadata(tenant_id, branch_id, {
        "series_classification": series_classification,
        "model_paths": {
            "daily":  model_path_daily,
            "weekly": model_path_weekly,
        },
    })

    # Lấy model_path chính (ưu tiên daily) để log và trả về
    model_path = model_path_daily or model_path_weekly or ""
    logger.info(
        "Train xong: daily=%s | weekly=%s | regular=%d | intermittent=%d | sparse=%d",
        "✓" if model_path_daily else "✗",
        "✓" if model_path_weekly else "✗",
        len(regular_ids), len(intermittent_ids), len(sparse_ids),
    )

    return {
        "mae": mae,
        "mape": mape,
        "model_path": model_path,
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

        # Bước 3.5: Fetch historical weather cho toàn bộ khoảng train
        # Weather là optional — lỗi API không block quá trình train
        weather_df: pd.DataFrame | None = None
        try:
            from app.services import weather_service as _weather_svc  # noqa: PLC0415
            train_dates = sorted(df["ds"].dt.date.unique().tolist())
            if train_dates:
                await _weather_svc.fetch_historical_weather_for_branch(
                    branch_id, train_dates[0], train_dates[-1], db
                )
                weather_df = await _weather_svc.get_weather_df(branch_id, train_dates, db)
                if weather_df is not None:
                    logger.info(
                        "Đã fetch weather: branch=%s | %d/%d ngày có data",
                        branch_id, len(weather_df), len(train_dates),
                    )
        except Exception as exc:
            logger.warning("Bỏ qua weather data cho training: %s", exc)
            weather_df = None

        # Bước 4: Train model
        result = train_branch_model(
            df, tenant_id, branch_id, config, n_lags, yearly_seasonality,
            weather_df=weather_df,
        )

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
