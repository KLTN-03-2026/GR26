"""
Predict Service — dự báo tiêu thụ và tính gợi ý nhập kho.

Kiến trúc mới (từ migration 003):
- Load model per-branch: storage/models/{tenant_id}/{branch_id}/model.np
- n_forecasts và n_lags lấy từ config đã train (lưu trong train_metadata.json)
- Fallback Option C: nếu branch chưa có model → skip, KHÔNG ghi forecast_results

Option C — branch chưa có model:
  → Log warning với lý do cụ thể
  → Trả về list rỗng (predict_all_branches log và bỏ qua)
  → FE gọi GET /train/status?branch_id=... để biết lý do
"""

from datetime import date, timedelta

import pandas as pd
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.repositories.series_registry_repo import SeriesRegistryRepo
from app.schemas.forecast import IngredientPrediction
from app.services import data_service
from app.utils import dataframe_builder, model_io, stock_calculator

logger = get_logger(__name__)


def _validate_model_config(tenant_id: str, branch_id: str, expected_n_forecasts: int) -> bool:
    """
    Kiểm tra model đã train có đúng n_forecasts với config hiện tại không.

    Nếu n_forecasts lúc train ≠ n_forecasts trong config branch hiện tại
    → model không dùng được (output shape khác nhau) → cần retrain.

    Args:
        tenant_id: ID tenant
        branch_id: ID chi nhánh
        expected_n_forecasts: giá trị n_forecasts hiện tại từ branch config

    Returns:
        True nếu config khớp hoặc không có metadata (bỏ qua check).
        False nếu phát hiện mismatch → caller sẽ skip branch này.
    """
    config = model_io.get_model_config(tenant_id, branch_id)
    if not config:
        # Không có metadata → model cũ chưa lưu config → bỏ qua check
        return True
    actual = config.get("n_forecasts", 0)
    if actual != expected_n_forecasts:
        logger.warning(
            "Model của branch %s được train với n_forecasts=%d "
            "nhưng config hiện tại là n_forecasts=%d. Cần retrain!",
            branch_id, actual, expected_n_forecasts,
        )
        return False
    return True


def _build_fallback_forecast(history_df: pd.DataFrame) -> pd.DataFrame:
    """
    Tạo dự báo fallback từ trung bình 7 ngày tiêu thụ gần nhất.

    Dùng khi:
    - Tenant chưa có model được train
    - Load/predict model thất bại

    Args:
        history_df: DataFrame lịch sử tiêu thụ với cột 'y'.
                    Có thể rỗng — khi đó avg_daily = 0.0.

    Returns:
        DataFrame với cột ['ds', 'yhat1'] — 7 ngày tương lai,
        mỗi ngày có yhat1 = avg_daily (giá trị bằng nhau).
    """
    if history_df.empty:
        avg_daily = 0.0
    else:
        # Lấy trung bình 7 ngày gần nhất để ước lượng tiêu thụ hàng ngày
        recent = history_df.tail(7)
        avg_daily = float(recent["y"].mean())

    future_dates = pd.date_range(
        start=date.today() + timedelta(days=1),
        periods=7,
        freq="D",
    )
    return pd.DataFrame({
        "ds": pd.to_datetime(future_dates),
        "yhat1": [avg_daily] * 7,
        "lower_bound": [None] * 7,
        "upper_bound": [None] * 7,
    })


def _expand_weekly_to_daily(
    fc_weekly: pd.DataFrame,
    periods: int = 7,
) -> pd.DataFrame:
    """
    Chuyển dự báo tuần (4 tuần) thành dự báo ngày để đồng nhất với daily model.

    Chia đều lượng tiêu thụ của 1 tuần cho 7 ngày.
    Ví dụ: Tuần 1 dự báo 140 kg → mỗi ngày 20 kg.

    Args:
        fc_weekly: DataFrame với cột ['ds' (weekly timestamp), 'yhat1' (weekly qty)]
        periods: Số ngày cần lấy (mặc định 7 — tương đương 1 tuần đầu)

    Returns:
        DataFrame với cột ['ds' (daily), 'yhat1' (daily qty)]
        Đúng `periods` rows bắt đầu từ ngày đầu tiên của tuần đầu tiên.
    """
    rows = []
    for _, week_row in fc_weekly.iterrows():
        daily_qty = float(week_row["yhat1"]) / 7.0
        # Tính ngày đầu tuần từ label W-MON (label là cuối tuần = Monday)
        # W-MON: chu kỳ Tue → Mon, label = Monday
        # Ngày bắt đầu của tuần = Monday - 6 ngày = Tuesday tuần trước
        week_end = pd.Timestamp(week_row["ds"])
        week_start = week_end - pd.Timedelta(days=6)  # Tuesday
        for d in range(7):
            rows.append({
                "ds": week_start + pd.Timedelta(days=d),
                "yhat1": daily_qty,
            })

    if not rows:
        return pd.DataFrame(columns=["ds", "yhat1"])

    result = pd.DataFrame(rows).head(periods)
    result = result.sort_values("ds").reset_index(drop=True)
    return result


async def _upsert_forecast_results(
    db: AsyncSession,
    series_id_int: int,
    forecast_df: pd.DataFrame,
    stockout_date: date | None,
    suggested_qty: float,
    urgency: str,
    suggested_order_date: date | None,
    is_fallback: bool,
) -> None:
    """
    Upsert kết quả dự báo vào bảng forecast_results — 1 row cho mỗi ngày.

    Dùng ON CONFLICT để tránh duplicate khi predict job chạy lại.
    Không commit ở đây — để predict_branch kiểm soát transaction boundary.

    Args:
        db: AsyncSession
        series_id_int: Integer PK trong ai_series_registry (FK của forecast_results)
        forecast_df: DataFrame với cột ['ds', 'yhat1'] — 7 rows tương lai
        stockout_date: Ngày dự kiến hết hàng (None = không ước tính trong horizon)
        suggested_qty: Số lượng gợi ý nhập kho
        urgency: Mức độ cấp bách — ok / warning / critical
        suggested_order_date: Ngày nên đặt hàng
        is_fallback: True nếu dùng fallback thay vì model thật
    """
    # Xóa forecast cũ của series này (từ hôm nay trở đi) trước khi ghi mới.
    # Tránh tình trạng config thay đổi (vd NP_N_FORECASTS 14→7) mà rows cũ vẫn còn.
    await db.execute(
        text("DELETE FROM forecast_results WHERE series_id = :series_id AND forecast_date >= :today"),
        {"series_id": series_id_int, "today": date.today()},
    )

    has_lower = "lower_bound" in forecast_df.columns
    has_upper = "upper_bound" in forecast_df.columns

    for _, row in forecast_df.iterrows():
        # Chuyển Timestamp → date nếu cần
        forecast_date = row["ds"].date() if hasattr(row["ds"], "date") else row["ds"]
        predicted_qty = float(max(float(row["yhat1"]), 0.0))

        # Đọc khoảng tin cậy — None nếu model cũ chưa train với quantiles
        lo = row.get("lower_bound") if has_lower else None
        hi = row.get("upper_bound") if has_upper else None
        lower_bound: float | None = float(max(float(lo), 0.0)) if lo is not None and pd.notna(lo) else None
        upper_bound: float | None = float(max(float(hi), 0.0)) if hi is not None and pd.notna(hi) else None

        await db.execute(
            text("""
                INSERT INTO forecast_results
                    (series_id, forecast_date, predicted_qty, stockout_date, suggested_qty,
                     urgency, suggested_order_date, is_fallback, lower_bound, upper_bound)
                VALUES
                    (:series_id, :forecast_date, :predicted_qty, :stockout_date, :suggested_qty,
                     :urgency, :suggested_order_date, :is_fallback, :lower_bound, :upper_bound)
                ON CONFLICT (series_id, forecast_date)
                DO UPDATE SET
                    predicted_qty        = EXCLUDED.predicted_qty,
                    stockout_date        = EXCLUDED.stockout_date,
                    suggested_qty        = EXCLUDED.suggested_qty,
                    urgency              = EXCLUDED.urgency,
                    suggested_order_date = EXCLUDED.suggested_order_date,
                    is_fallback          = EXCLUDED.is_fallback,
                    lower_bound          = EXCLUDED.lower_bound,
                    upper_bound          = EXCLUDED.upper_bound
            """),
            {
                "series_id": series_id_int,
                "forecast_date": forecast_date,
                "predicted_qty": predicted_qty,
                "stockout_date": stockout_date,
                "suggested_qty": suggested_qty,
                "urgency": urgency,
                "suggested_order_date": suggested_order_date,
                "is_fallback": is_fallback,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
            },
        )


async def predict_branch(
    tenant_id: str,
    branch_id: str,
    db: AsyncSession,
) -> list[IngredientPrediction]:
    """
    Dự báo tiêu thụ và tính gợi ý nhập kho cho toàn bộ nguyên liệu của 1 chi nhánh.

    Luồng:
    a. Load model của tenant (nếu chưa có → dùng fallback bằng trung bình lịch sử)
    b. Lấy danh sách nguyên liệu đang có trong kho
    c. Với mỗi nguyên liệu:
       - Resolve integer series_id qua SeriesRegistryRepo
       - Lấy lịch sử tiêu thụ gần đây
       - Lấy tồn kho hiện tại
       - Build future DataFrame + model.predict() hoặc fallback
       - Tính stockout_date, suggested_qty, urgency
       - Upsert vào forecast_results
    d. Commit + trả về list IngredientPrediction

    Args:
        tenant_id: ID tenant — BẮT BUỘC, mọi query đều filter theo tenant này
        branch_id: UUID chi nhánh cần predict
        db: AsyncSession

    Returns:
        list[IngredientPrediction] — kết quả dự báo cho từng nguyên liệu.
        Trả về list rỗng nếu chi nhánh không có nguyên liệu nào.
    """
    # ── Bước 1: Kiểm tra model của branch (Option C — không fallback moving average) ──
    if not model_io.model_exists(tenant_id, branch_id):
        logger.warning(
            "Branch %s chưa có model → skip predict (Option C). "
            "Gọi PUT /train/config hoặc POST /train/trigger để train.",
            branch_id,
        )
        return []

    # Load config đã train để biết n_forecasts, n_lags, use_weather_regressor
    branch_model_config = model_io.get_model_config(tenant_id, branch_id) or {}
    n_forecasts = branch_model_config.get("n_forecasts", settings.np_n_forecasts)
    n_lags = branch_model_config.get("n_lags", settings.np_n_lags)
    # Backward-compatible: model cũ không có key này → False (không dùng weather)
    use_weather = bool(branch_model_config.get("use_weather_regressor", False))

    # Đọc series_classification từ metadata (top-level, ngoài "config")
    # isinstance check: get_train_metadata có thể trả về None hoặc dict — không dùng MagicMock trong test
    _raw_meta = model_io.get_train_metadata(tenant_id, branch_id)
    branch_metadata: dict = _raw_meta if isinstance(_raw_meta, dict) else {}
    classification = branch_metadata.get("series_classification", None)
    # Backward compat: nếu không có classification → tất cả đi qua daily model
    if classification is not None:
        regular_ids: set[str] = set(classification.get("regular", []))
    else:
        regular_ids = None  # type: ignore[assignment] — sentinel: treat all as regular

    # Kiểm tra n_forecasts có khớp với config branch hiện tại không
    # (config thay đổi sau khi train → cần retrain trước khi predict)
    if not _validate_model_config(tenant_id, branch_id, n_forecasts):
        logger.warning(
            "Branch %s: config mismatch → skip predict, cần retrain trước",
            branch_id,
        )
        return []

    # Load daily model (bắt buộc — hoặc backward compat model.np)
    model_daily = model_io.load_model(tenant_id, branch_id, model_type="daily")
    if model_daily is None:
        logger.error(
            "Load model_daily thất bại: tenant=%s branch=%s → skip predict",
            tenant_id, branch_id,
        )
        return []

    # Load weekly model (tùy chọn — None nếu chưa train hoặc không có series weekly)
    model_weekly = model_io.load_model(tenant_id, branch_id, model_type="weekly")

    # ── Bước 2: Lấy danh sách nguyên liệu ──────────────────────────────────
    ingredients = await data_service.get_all_ingredients_of_branch(
        db, tenant_id, branch_id
    )

    if not ingredients:
        logger.info(
            "Không có nguyên liệu nào trong kho: tenant=%s branch=%s",
            tenant_id, branch_id,
        )
        return []

    # Lấy đủ history cho n_lags + buffer ngày
    history_days = n_lags + 14

    # ── Bước 2.5: Pre-fetch weather cho toàn branch (1 lần, dùng chung) ────
    # Cần weather cho: history_days ngày gần đây + n_forecasts ngày tương lai
    branch_weather_df: pd.DataFrame | None = None
    if use_weather:
        try:
            from datetime import timedelta as _td  # noqa: PLC0415
            from app.services import weather_service as _weather_svc  # noqa: PLC0415

            today = date.today()
            history_dates = [today - _td(days=i) for i in range(history_days + 1)]
            forecast_dates = [today + _td(days=i) for i in range(1, n_forecasts + 1)]
            all_needed_dates = history_dates + forecast_dates

            # Cập nhật forecast weather mới nhất (8-day ahead)
            await _weather_svc.fetch_weather_for_branch(branch_id, db)
            # Fetch historical nếu cần (archive API)
            if history_dates:
                await _weather_svc.fetch_historical_weather_for_branch(
                    branch_id, history_dates[-1], history_dates[0], db
                )
            branch_weather_df = await _weather_svc.get_weather_df(
                branch_id, all_needed_dates, db
            )
            if branch_weather_df is not None:
                logger.info(
                    "Weather cho predict: branch=%s | %d/%d ngày có data",
                    branch_id, len(branch_weather_df), len(all_needed_dates),
                )
        except Exception as exc:
            logger.warning(
                "Không lấy được weather cho predict branch=%s: %s — bỏ qua",
                branch_id, exc,
            )
            branch_weather_df = None

    series_repo = SeriesRegistryRepo(db)
    results: list[IngredientPrediction] = []

    # ── Bước 3: Predict từng nguyên liệu ───────────────────────────────────
    for ingredient in ingredients:
        ingredient_id: str = ingredient["id"]
        ingredient_name: str = ingredient["name"]
        unit: str = ingredient["unit"]

        try:
            # Lấy min_stock từ ingredient info (đã có trong dict từ data_service)
            min_stock: float = float(ingredient.get("min_stock", 0.0))

            # Resolve integer series_id — tạo mới nếu chưa có trong registry
            series_entry = await series_repo.get_or_create(ingredient_id, branch_id)
            series_id_str: str = series_entry.series_id   # "s{int}"
            series_id_int: int = series_entry.id           # integer FK

            # Lấy lịch sử tiêu thụ từ consumption_history (đã cache, nhanh hơn)
            # Fallback sang inventory_transactions nếu chưa có data trong cache
            try:
                history_df = await data_service.get_recent_consumption(
                    db, series_id_str, days=history_days,
                )
            except Exception as exc:
                logger.warning(
                    "Không đọc được consumption_history cho series=%s: %s "
                    "→ fallback inventory_transactions",
                    series_id_str, exc,
                )
                history_df = pd.DataFrame(columns=["ds", "y"])

            if history_df.empty:
                logger.info(
                    "consumption_history trống cho series=%s → fallback inventory_transactions",
                    series_id_str,
                )
                history_df = await data_service.get_ingredient_consumption(
                    db, tenant_id, branch_id, ingredient_id, days_back=history_days,
                )

            # Lấy tồn kho hiện tại từ inventory_balances
            current_stock = await data_service.get_current_stock(
                db, tenant_id, branch_id, ingredient_id,
            )

            # ── Predict ─────────────────────────────────────────────────
            is_fallback = False

            # Xác định model nào dùng cho series này:
            # - regular_ids=None (backward compat) → tất cả dùng daily
            # - series_id_str in regular_ids → daily model
            # - còn lại → weekly model (nếu có), không thì fallback
            use_daily_model = (regular_ids is None) or (series_id_str in regular_ids)

            if not history_df.empty:
                try:
                    if use_daily_model:
                        # ── Daily predict path ─────────────────────────
                        future_df = dataframe_builder.build_future_df(
                            history_df, series_id_str, periods=n_forecasts, freq="D",
                        )

                        # Merge weather regressors nếu model được train kèm weather
                        if use_weather and branch_weather_df is not None and not branch_weather_df.empty:
                            future_df = future_df.merge(
                                branch_weather_df[["ds", "temperature", "precipitation"]],
                                on="ds", how="left",
                            )
                            median_temp = float(branch_weather_df["temperature"].median())
                            future_df["temperature"] = future_df["temperature"].fillna(median_temp)
                            future_df["precipitation"] = future_df["precipitation"].fillna(0.0)

                        raw_pred = model_daily.predict(future_df)  # type: ignore[union-attr]

                        last_history_date = history_df["ds"].max()
                        last_hist_row = raw_pred[raw_pred["ds"] <= last_history_date].iloc[-1]
                        n_fc = n_forecasts
                        forecast_dates = pd.date_range(
                            start=pd.Timestamp(date.today()) + pd.Timedelta(days=1),
                            periods=n_fc, freq="D",
                        )
                        forecast_values = [
                            max(
                                float(last_hist_row[f"yhat{h}"])
                                if pd.notna(last_hist_row.get(f"yhat{h}")) else 0.0,
                                0.0,
                            )
                            for h in range(1, n_fc + 1)
                        ]
                        nonzero_vals = [v for v in forecast_values if v > 0]
                        fallback_mean = sum(nonzero_vals) / len(nonzero_vals) if nonzero_vals else 0.0
                        forecast_values = [v if v > 0 else fallback_mean for v in forecast_values]

                        # Extract khoảng tin cậy nếu model train với quantiles=[0.1, 0.9]
                        lower_vals: list[float | None] = []
                        upper_vals: list[float | None] = []
                        for h in range(1, n_fc + 1):
                            lo = last_hist_row.get(f"yhat{h} 10.0%")
                            hi = last_hist_row.get(f"yhat{h} 90.0%")
                            if lo is not None and pd.notna(lo) and hi is not None and pd.notna(hi):
                                lower_vals.append(max(float(lo), 0.0))
                                upper_vals.append(max(float(hi), 0.0))
                            else:
                                lower_vals.append(None)
                                upper_vals.append(None)

                        forecast_df = pd.DataFrame({
                            "ds": forecast_dates,
                            "yhat1": forecast_values,
                            "lower_bound": lower_vals,
                            "upper_bound": upper_vals,
                        })

                    else:
                        # ── Weekly predict path (intermittent / sparse) ──
                        if model_weekly is None:
                            raise RuntimeError("model_weekly chưa được train")

                        # Lấy thêm history để có đủ ≥ 8 tuần (n_lags weekly)
                        history_weekly = dataframe_builder.aggregate_to_weekly(
                            pd.DataFrame({
                                "ds": history_df["ds"],
                                "y":  history_df["y"],
                                "ID": series_id_str,
                            })
                        )
                        if history_weekly.empty:
                            raise RuntimeError("aggregate_to_weekly trả về rỗng")

                        future_df_w = dataframe_builder.build_future_df(
                            history_weekly[history_weekly["ID"] == series_id_str],
                            series_id_str, periods=4, freq="W-MON",
                        )
                        raw_pred_w = model_weekly.predict(future_df_w)  # type: ignore[union-attr]

                        # Lấy 4 tuần dự báo (future rows: y=NaN)
                        last_hist_week = history_weekly[history_weekly["ID"] == series_id_str]["ds"].max()
                        fc_weekly = raw_pred_w[raw_pred_w["ds"] > last_hist_week][["ds", "yhat1"]].head(4)

                        # Clip âm rồi expand về daily
                        fc_weekly = fc_weekly.copy()
                        fc_weekly["yhat1"] = fc_weekly["yhat1"].clip(lower=0.0)
                        forecast_df = _expand_weekly_to_daily(fc_weekly, periods=n_forecasts)

                        # Override dates về ngày thực tế từ ngày mai
                        forecast_dates = pd.date_range(
                            start=pd.Timestamp(date.today()) + pd.Timedelta(days=1),
                            periods=n_forecasts, freq="D",
                        )
                        weekly_vals = (
                            forecast_df["yhat1"].values[:n_forecasts].tolist()
                            if len(forecast_df) >= n_forecasts
                            else list(forecast_df["yhat1"].values) + [0.0] * (n_forecasts - len(forecast_df))
                        )
                        forecast_df = pd.DataFrame({
                            "ds": forecast_dates,
                            "yhat1": weekly_vals,
                            "lower_bound": [None] * n_forecasts,
                            "upper_bound": [None] * n_forecasts,
                        })

                except Exception as exc:
                    logger.error(
                        "Predict thất bại: ingredient=%s (%s) | %s → fallback",
                        ingredient_id, ingredient_name, exc,
                    )
                    forecast_df = _build_fallback_forecast(history_df)
                    is_fallback = True
            else:
                # Không có history → fallback moving average cho ingredient này
                logger.info(
                    "Không có history cho ingredient=%s → fallback moving average",
                    ingredient_id,
                )
                forecast_df = _build_fallback_forecast(history_df)
                is_fallback = True

            # ── Tính các chỉ số kho ──────────────────────────────────────
            # Tính avg tiêu thụ để ước tính order date khi tồn kho vượt forecast window
            avg_daily = stock_calculator.calc_avg_daily_consumption(forecast_df)

            stockout_date = stock_calculator.predict_stockout_date(
                current_stock,
                forecast_df,
                min_stock=min_stock,
            )
            suggested_qty = stock_calculator.calc_suggested_qty(
                forecast_df,
                current_stock=current_stock,
            )
            suggested_order_date = stock_calculator.calc_suggested_order_date(
                stockout_date,
                avg_daily_consumption=avg_daily,
                min_stock=min_stock,
                current_stock=current_stock,
            )
            urgency = stock_calculator.get_urgency(stockout_date, n_forecasts=n_forecasts)

            # ── Ghi vào DB ───────────────────────────────────────────────
            await _upsert_forecast_results(
                db, series_id_int, forecast_df, stockout_date, suggested_qty,
                urgency=urgency,
                suggested_order_date=suggested_order_date,
                is_fallback=is_fallback,
            )

            results.append(IngredientPrediction(
                ingredient_id=ingredient_id,
                ingredient_name=ingredient_name,
                unit=unit,
                current_stock=current_stock,
                stockout_date=stockout_date,
                suggested_order_qty=suggested_qty,
                suggested_order_date=suggested_order_date,
                urgency=urgency,
                is_fallback=is_fallback,
            ))

        except Exception as exc:
            # Không để lỗi 1 ingredient phá vỡ toàn bộ branch
            logger.error(
                "Bỏ qua ingredient %s (%s): %s",
                ingredient_id, ingredient_name, exc,
            )
            continue

    await db.commit()

    logger.info(
        "predict_branch xong: tenant=%s branch=%s → %d ingredients",
        tenant_id, branch_id, len(results),
    )
    return results


async def predict_all_branches(db: AsyncSession) -> None:
    """
    Dự báo cho tất cả chi nhánh của tất cả tenant đang active.

    Được gọi bởi cron job mỗi đêm 00:30 (scheduler/jobs.py).
    Lỗi 1 branch không làm dừng các branch khác — log error và tiếp tục.

    Args:
        db: AsyncSession

    Log tổng kết:
        "Predict hoàn thành: X tenant | Y branch | Z ingredient records"
    """
    tenant_ids = await data_service.get_all_active_tenants(db)
    logger.info("Bắt đầu predict_all_branches: %d tenant active", len(tenant_ids))

    total_branches = 0
    total_ingredients = 0

    for tenant_id in tenant_ids:
        branches = await data_service.get_all_active_branches(db, tenant_id)

        for branch in branches:
            branch_id: str = branch["id"]
            try:
                predictions = await predict_branch(tenant_id, branch_id, db)
                total_branches += 1
                total_ingredients += len(predictions)
            except Exception as exc:
                logger.error(
                    "predict_branch thất bại: tenant=%s branch=%s | %s",
                    tenant_id, branch_id, exc,
                )
                continue

    logger.info(
        "Predict hoàn thành: %d tenant | %d branch | %d ingredient records",
        len(tenant_ids), total_branches, total_ingredients,
    )
