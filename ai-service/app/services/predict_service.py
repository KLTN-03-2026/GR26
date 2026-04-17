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
    })


async def _upsert_forecast_results(
    db: AsyncSession,
    series_id_int: int,
    forecast_df: pd.DataFrame,
    stockout_date: date | None,
    suggested_qty: float,
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
    """
    # Xóa forecast cũ của series này (từ hôm nay trở đi) trước khi ghi mới.
    # Tránh tình trạng config thay đổi (vd NP_N_FORECASTS 14→7) mà rows cũ vẫn còn.
    await db.execute(
        text("DELETE FROM forecast_results WHERE series_id = :series_id AND forecast_date >= :today"),
        {"series_id": series_id_int, "today": date.today()},
    )

    for _, row in forecast_df.iterrows():
        # Chuyển Timestamp → date nếu cần
        forecast_date = row["ds"].date() if hasattr(row["ds"], "date") else row["ds"]
        predicted_qty = float(max(float(row["yhat1"]), 0.0))

        await db.execute(
            text("""
                INSERT INTO forecast_results
                    (series_id, forecast_date, predicted_qty, stockout_date, suggested_qty)
                VALUES
                    (:series_id, :forecast_date, :predicted_qty, :stockout_date, :suggested_qty)
                ON CONFLICT (series_id, forecast_date)
                DO UPDATE SET
                    predicted_qty = EXCLUDED.predicted_qty,
                    stockout_date = EXCLUDED.stockout_date,
                    suggested_qty = EXCLUDED.suggested_qty
            """),
            {
                "series_id": series_id_int,
                "forecast_date": forecast_date,
                "predicted_qty": predicted_qty,
                "stockout_date": stockout_date,
                "suggested_qty": suggested_qty,
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

    # Load config đã train để biết n_forecasts, n_lags
    branch_model_config = model_io.get_model_config(tenant_id, branch_id) or {}
    n_forecasts = branch_model_config.get("n_forecasts", settings.np_n_forecasts)
    n_lags = branch_model_config.get("n_lags", settings.np_n_lags)

    # Kiểm tra n_forecasts có khớp với config branch hiện tại không
    # (config thay đổi sau khi train → cần retrain trước khi predict)
    if not _validate_model_config(tenant_id, branch_id, n_forecasts):
        logger.warning(
            "Branch %s: config mismatch → skip predict, cần retrain trước",
            branch_id,
        )
        return []

    # Load model
    model = model_io.load_model(tenant_id, branch_id)
    if model is None:
        logger.error(
            "Load model thất bại: tenant=%s branch=%s → skip predict",
            tenant_id, branch_id,
        )
        return []

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

            if not history_df.empty:
                try:
                    # Build future DataFrame (lịch sử + n_forecasts ngày tương lai)
                    future_df = dataframe_builder.build_future_df(
                        history_df, series_id_str, periods=n_forecasts,
                    )
                    # NeuralProphet predict — trả về DataFrame với yhat1..yhat{n_forecasts}
                    raw_pred = model.predict(future_df)  # type: ignore[union-attr]

                    # Kết quả đúng nằm ở row lịch sử cuối cùng:
                    # yhat1=ngày+1, yhat2=ngày+2, ..., yhat{n}=ngày+n.
                    last_history_date = history_df["ds"].max()
                    last_hist_row = raw_pred[
                        raw_pred["ds"] <= last_history_date
                    ].iloc[-1]
                    n_fc = n_forecasts
                    # Bắt đầu từ ngày mai — không phụ thuộc vào last_history_date
                    # (last_history_date có thể là vài ngày trước hôm nay → forecast bị thiếu ngày)
                    forecast_dates = pd.date_range(
                        start=pd.Timestamp(date.today()) + pd.Timedelta(days=1),
                        periods=n_fc,
                        freq="D",
                    )
                    forecast_values = [
                        max(
                            float(last_hist_row[f"yhat{h}"])
                            if pd.notna(last_hist_row.get(f"yhat{h}"))
                            else 0.0,
                            0.0,
                        )
                        for h in range(1, n_fc + 1)
                    ]

                    # Thay thế 0-values bằng trung bình các ngày hợp lệ.
                    # NeuralProphet đôi khi dự báo âm cho các ngày xa (12-14 ngày)
                    # với nguyên liệu tiêu thụ thấp → bị clip thành 0 → misleading.
                    # Dùng fallback = mean của các ngày có giá trị > 0.
                    nonzero_vals = [v for v in forecast_values if v > 0]
                    fallback_mean = sum(nonzero_vals) / len(nonzero_vals) if nonzero_vals else 0.0
                    forecast_values = [
                        v if v > 0 else fallback_mean
                        for v in forecast_values
                    ]

                    forecast_df = pd.DataFrame({
                        "ds": forecast_dates,
                        "yhat1": forecast_values,
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
