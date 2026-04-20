"""
Weather Service — lấy dữ liệu thời tiết từ Open-Meteo API.

Open-Meteo là API miễn phí, không cần API key cho forecast ngắn hạn.
Kết quả được cache trong bảng weather_cache để tránh gọi lại nhiều lần.

Weather là dữ liệu BỔ SUNG — nếu API lỗi, train/predict vẫn chạy bình thường.
"""

from datetime import date
from typing import Any

import httpx
import pandas as pd
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger

logger = get_logger(__name__)

# URL Open-Meteo — miễn phí, không cần key
_OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
_HTTP_TIMEOUT = 10.0  # giây


async def fetch_weather_for_branch(
    branch_id: str,
    db: AsyncSession,
) -> bool:
    """
    Lấy và cache thời tiết 8 ngày tới cho 1 chi nhánh từ Open-Meteo.

    Bỏ qua nếu chi nhánh không có tọa độ hoặc đã có cache hôm nay.
    Không raise exception — lỗi API là bình thường, trả về False.

    Args:
        branch_id: UUID chi nhánh (string)
        db: AsyncSession

    Returns:
        True nếu cache thành công, False nếu skip hoặc lỗi
    """
    # Bước 1: Lấy tọa độ chi nhánh từ bảng branches của BE
    coord_sql = text("""
        SELECT latitude, longitude
        FROM branches
        WHERE id::text = :branch_id
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
        LIMIT 1
    """)
    coord_result = await db.execute(coord_sql, {"branch_id": branch_id})
    coord_row = coord_result.fetchone()

    if coord_row is None:
        logger.debug("Chi nhánh %s không có tọa độ — bỏ qua fetch weather", branch_id)
        return False

    lat, lng = float(coord_row[0]), float(coord_row[1])

    # Bước 2: Kiểm tra cache hôm nay — nếu đã có thì bỏ qua gọi API
    cache_check_sql = text("""
        SELECT 1 FROM weather_cache
        WHERE branch_id = :branch_id
          AND date = :today
        LIMIT 1
    """)
    cache_check = await db.execute(cache_check_sql, {
        "branch_id": branch_id,
        "today": date.today(),
    })
    if cache_check.fetchone() is not None:
        logger.debug("Weather cache hit: branch=%s date=%s", branch_id, date.today())
        return True

    # Bước 3: Gọi Open-Meteo API
    params: dict[str, Any] = {
        "latitude": lat,
        "longitude": lng,
        "daily": ["temperature_2m_max", "precipitation_sum"],
        "timezone": "Asia/Ho_Chi_Minh",
        "forecast_days": 8,
    }

    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.get(_OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        logger.warning("Open-Meteo API lỗi: branch=%s | %s", branch_id, exc)
        return False
    except Exception as exc:
        logger.warning("Lỗi không xác định khi fetch weather: branch=%s | %s", branch_id, exc)
        return False

    # Bước 4: Parse response
    try:
        daily = data["daily"]
        dates: list[str] = daily["time"]
        temps: list[float | None] = daily["temperature_2m_max"]
        precips: list[float | None] = daily["precipitation_sum"]
    except (KeyError, TypeError) as exc:
        logger.warning("Parse Open-Meteo response lỗi: branch=%s | %s", branch_id, exc)
        return False

    # Bước 5: UPSERT từng ngày vào weather_cache
    upsert_sql = text("""
        INSERT INTO weather_cache (branch_id, date, temperature, precipitation)
        VALUES (:branch_id, :date, :temperature, :precipitation)
        ON CONFLICT (branch_id, date)
        DO UPDATE SET
            temperature   = EXCLUDED.temperature,
            precipitation = EXCLUDED.precipitation,
            cached_at     = NOW()
    """)

    for day_str, temp, precip in zip(dates, temps, precips):
        await db.execute(upsert_sql, {
            "branch_id": branch_id,
            "date": day_str,           # "YYYY-MM-DD" string — PostgreSQL tự convert sang DATE
            "temperature": temp,
            "precipitation": precip,
        })

    await db.commit()
    logger.info(
        "Đã cache weather: branch=%s | %d ngày | %.1f°C hôm nay",
        branch_id, len(dates), temps[0] if temps else 0.0,
    )
    return True


async def get_weather_df(
    branch_id: str,
    dates: list[date],
    db: AsyncSession,
) -> pd.DataFrame | None:
    """
    Lấy dữ liệu thời tiết từ cache cho danh sách ngày cụ thể.

    Dùng để bổ sung regressors khi train/predict NeuralProphet.
    Trả về None nếu không có data — caller tự quyết định có dùng không.

    Args:
        branch_id: UUID chi nhánh
        dates: Danh sách ngày cần lấy
        db: AsyncSession

    Returns:
        DataFrame với cột [ds (datetime64), temperature (float), precipitation (float)]
        None nếu không có data trong cache
    """
    if not dates:
        return None

    sql = text("""
        SELECT date, temperature, precipitation
        FROM weather_cache
        WHERE branch_id = :branch_id
          AND date = ANY(:dates)
        ORDER BY date ASC
    """)

    result = await db.execute(sql, {
        "branch_id": branch_id,
        "dates": dates,
    })
    rows = result.fetchall()

    if not rows:
        return None

    df = pd.DataFrame(rows, columns=["ds", "temperature", "precipitation"])
    df["ds"] = pd.to_datetime(df["ds"])
    df["temperature"] = df["temperature"].astype(float)
    df["precipitation"] = df["precipitation"].astype(float)

    return df


async def fetch_all_branches_weather(db: AsyncSession) -> None:
    """
    Cron job: cập nhật thời tiết cho tất cả chi nhánh có tọa độ.

    Gọi mỗi ngày lúc 6:00 AM — lấy dữ liệu 8 ngày tới cho mỗi chi nhánh.
    Log tổng số chi nhánh đã cập nhật thành công.

    Args:
        db: AsyncSession
    """
    # Lấy tất cả chi nhánh ACTIVE có lat/lng trong cùng PostgreSQL
    sql = text("""
        SELECT id::text
        FROM branches
        WHERE latitude  IS NOT NULL
          AND longitude IS NOT NULL
          AND status    = 'ACTIVE'
        ORDER BY id
    """)
    result = await db.execute(sql)
    rows = result.fetchall()

    if not rows:
        logger.info("Không có chi nhánh nào có tọa độ — bỏ qua fetch weather")
        return

    branch_ids = [row[0] for row in rows]
    total = len(branch_ids)
    success_count = 0

    for branch_id in branch_ids:
        ok = await fetch_weather_for_branch(branch_id, db)
        if ok:
            success_count += 1

    logger.info(
        "Đã cập nhật thời tiết cho %d/%d chi nhánh",
        success_count, total,
    )
