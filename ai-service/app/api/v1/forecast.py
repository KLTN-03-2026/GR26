"""
Endpoint dự báo tiêu thụ nguyên liệu.
Chỉ ĐỌC từ bảng forecast_results — KHÔNG chạy model realtime.
Response time target: < 200ms.
"""

import time
from collections import defaultdict
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant, get_db, verify_branch_access
from app.core.logging import get_logger
from app.core.security import TokenPayload
from app.schemas.forecast import (
    DayForecast,
    ForecastResponse,
    ForecastSummary,
    IngredientForecast,
)
from app.utils import model_io
from app.utils.stock_calculator import (
    calc_suggested_order_date,
    get_urgency,
    predict_stockout_date_from_forecasts,
)

router = APIRouter(prefix="/forecast", tags=["Forecast"])
logger = get_logger(__name__)

# SQL lấy toàn bộ forecast cho 1 chi nhánh từ hôm nay trở đi
_SQL_BRANCH_FORECAST = text(
    """
    SELECT
        asr.ingredient_id,
        i.name                       AS ingredient_name,
        i.unit,
        fr.forecast_date,
        fr.predicted_qty,
        COALESCE(ib.quantity, 0.0)   AS current_stock
    FROM forecast_results fr
    JOIN ai_series_registry asr ON asr.id = fr.series_id
    JOIN items i ON i.id::text = asr.ingredient_id::text
    LEFT JOIN inventory_balances ib
        ON ib.item_id::text = asr.ingredient_id::text
        AND ib.branch_id::text = :branch_id
        AND ib.tenant_id::text = :tenant_id
    WHERE asr.branch_id::text = :branch_id
      AND fr.forecast_date >= :today
    ORDER BY i.name ASC, fr.forecast_date ASC
"""
)

# SQL lấy forecast cho 1 nguyên liệu cụ thể
_SQL_INGREDIENT_FORECAST = text(
    """
    SELECT
        asr.ingredient_id,
        i.name                       AS ingredient_name,
        i.unit,
        fr.forecast_date,
        fr.predicted_qty,
        COALESCE(ib.quantity, 0.0)   AS current_stock
    FROM forecast_results fr
    JOIN ai_series_registry asr ON asr.id = fr.series_id
    JOIN items i ON i.id::text = asr.ingredient_id::text
    LEFT JOIN inventory_balances ib
        ON ib.item_id::text = asr.ingredient_id::text
        AND ib.branch_id::text = :branch_id
        AND ib.tenant_id::text = :tenant_id
    WHERE asr.branch_id::text = :branch_id
      AND asr.ingredient_id::text = :ingredient_id
      AND fr.forecast_date >= :today
    ORDER BY fr.forecast_date ASC
"""
)


def _rows_to_ingredient_forecasts(rows: list) -> list[IngredientForecast]:
    """
    Chuyển đổi danh sách rows DB thành list[IngredientForecast].

    Nhóm theo ingredient_id, tính stockout/urgency/suggested_order_date realtime.
    """
    # Nhóm rows theo ingredient_id
    grouped: dict[str, dict] = defaultdict(
        lambda: {
            "ingredient_name": "",
            "unit": "",
            "current_stock": 0.0,
            "forecast_days": [],
        }
    )

    for row in rows:
        ing_id = str(row.ingredient_id)
        g = grouped[ing_id]
        g["ingredient_name"] = row.ingredient_name
        g["unit"] = row.unit
        # Lấy current_stock từ row đầu tiên của ingredient.
        if not g["forecast_days"]:
            g["current_stock"] = float(row.current_stock)
        g["forecast_days"].append(
            DayForecast(
                forecast_date=row.forecast_date,
                predicted_qty=float(row.predicted_qty),
            )
        )

    result: list[IngredientForecast] = []
    for ing_id, g in grouped.items():
        current_stock: float = g["current_stock"]
        forecast_days: list[DayForecast] = g["forecast_days"]

        # Recompute stockout_date từ current_stock realtime + forecast hiện tại,
        # gồm cả phần ngoại suy sau forecast window nếu tồn kho chỉ dư vài ngày.
        stockout = predict_stockout_date_from_forecasts(
            current_stock,
            ((day.forecast_date, day.predicted_qty) for day in forecast_days),
        )

        # Recompute suggested_qty từ forecast thực tế (+ 20% safety buffer)
        # và trừ tồn kho hiện tại. Nếu tồn kho đủ thì không đề nghị nhập thêm.
        total_forecast = sum(day.predicted_qty for day in forecast_days)
        suggested_qty = round(max(total_forecast * 1.2 - current_stock, 0.0), 2)

        result.append(
            IngredientForecast(
                ingredient_id=ing_id,
                ingredient_name=g["ingredient_name"],
                unit=g["unit"],
                current_stock=current_stock,
                forecast_days=forecast_days,
                stockout_date=stockout,
                suggested_order_qty=suggested_qty,
                suggested_order_date=calc_suggested_order_date(stockout),
                urgency=get_urgency(stockout),
                is_fallback=False,  # Không lưu trong DB — mặc định False
            )
        )

    return result


@router.get("/{branch_id}/summary", response_model=ForecastSummary)
async def get_branch_forecast_summary(
    branch_id: str = Depends(verify_branch_access),
    tenant: TokenPayload = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> ForecastSummary:
    """
    Lấy tổng quan dự báo cho dashboard — chỉ đếm theo urgency, không có chi tiết.
    Load nhanh hơn endpoint full forecast.

    Args:
        branch_id: ID chi nhánh (đã verify thuộc tenant)

    Returns:
        ForecastSummary với urgent_count, warning_count, ok_count
    """
    result = await db.execute(
        _SQL_BRANCH_FORECAST,
        {
            "branch_id": branch_id,
            "tenant_id": tenant.tenant_id,
            "today": date.today(),
        },
    )
    rows = result.fetchall()
    ingredients = _rows_to_ingredient_forecasts(rows)

    urgency_counts = {"critical": 0, "warning": 0, "ok": 0}
    for ingredient in ingredients:
        urgency_counts[ingredient.urgency] += 1

    total = len(ingredients)
    return ForecastSummary(
        branch_id=branch_id,
        generated_at=datetime.now(),
        urgent_count=urgency_counts["critical"],
        warning_count=urgency_counts["warning"],
        ok_count=urgency_counts["ok"],
        total_ingredients=total,
    )


@router.get("/{branch_id}/{ingredient_id}", response_model=IngredientForecast)
async def get_ingredient_forecast(
    ingredient_id: str,
    branch_id: str = Depends(verify_branch_access),
    tenant: TokenPayload = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> IngredientForecast:
    """
    Lấy dự báo 7 ngày của 1 nguyên liệu cụ thể tại chi nhánh.

    Args:
        branch_id: ID chi nhánh (đã verify thuộc tenant)
        ingredient_id: UUID nguyên liệu cần xem dự báo

    Returns:
        IngredientForecast cho nguyên liệu đó

    Raises:
        HTTPException 404: Không có dự báo cho nguyên liệu này
    """
    result = await db.execute(
        _SQL_INGREDIENT_FORECAST,
        {
            "branch_id": branch_id,
            "ingredient_id": ingredient_id,
            "tenant_id": tenant.tenant_id,
            "today": date.today(),
        },
    )
    rows = result.fetchall()

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không có dự báo cho nguyên liệu {ingredient_id} tại chi nhánh {branch_id}",
        )

    forecasts = _rows_to_ingredient_forecasts(rows)
    return forecasts[0]


@router.get("/{branch_id}", response_model=ForecastResponse)
async def get_branch_forecast(
    response: Response,
    branch_id: str = Depends(verify_branch_access),
    tenant: TokenPayload = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> ForecastResponse:
    """
    Lấy kết quả dự báo n ngày tới của tất cả nguyên liệu tại chi nhánh.
    Kết quả đọc từ bảng forecast_results — predict job đã tính sẵn mỗi đêm.

    Args:
        branch_id: ID chi nhánh (đã verify thuộc tenant)

    Returns:
        ForecastResponse với danh sách nguyên liệu và dự báo từng ngày.
        ingredients=[] nếu predict job chưa chạy hoặc chưa có data.
    """
    t_start = time.perf_counter()

    # Lấy metadata train để biết last_trained_at
    metadata = model_io.get_train_metadata(tenant.tenant_id)
    last_trained_at: datetime | None = None
    if metadata and metadata.get("trained_at"):
        try:
            last_trained_at = datetime.fromisoformat(metadata["trained_at"])
        except (ValueError, TypeError):
            pass

    # Lấy tên chi nhánh từ bảng branches
    branch_sql = text("SELECT name FROM branches WHERE id::text = :branch_id LIMIT 1")
    branch_result = await db.execute(branch_sql, {"branch_id": branch_id})
    branch_row = branch_result.fetchone()
    branch_name = branch_row[0] if branch_row else branch_id

    # Lấy forecast data
    result = await db.execute(
        _SQL_BRANCH_FORECAST,
        {
            "branch_id": branch_id,
            "tenant_id": tenant.tenant_id,
            "today": date.today(),
        },
    )
    rows = result.fetchall()

    ingredients = _rows_to_ingredient_forecasts(rows)

    elapsed_ms = (time.perf_counter() - t_start) * 1000
    logger.info(
        "forecast %s: %.0fms (%d ingredients)", branch_id, elapsed_ms, len(ingredients)
    )

    # Cache 5 phút — FE không cần real-time, forecast job chạy hàng đêm
    response.headers["Cache-Control"] = "max-age=300"

    return ForecastResponse(
        branch_id=branch_id,
        branch_name=branch_name,
        generated_at=datetime.now(),
        last_trained_at=last_trained_at,
        ingredients=ingredients,
    )
