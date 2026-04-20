"""
Tests cho app/services/weather_service.py

Dùng AsyncMock để mock AsyncSession — không cần kết nối DB thật.
Dùng unittest.mock.patch để chặn httpx.AsyncClient — không gọi API thật.

Mỗi test kiểm tra 1 nhánh logic của fetch_weather_for_branch() hoặc get_weather_df().
"""

from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pandas as pd
import pytest

from app.services.weather_service import fetch_weather_for_branch, get_weather_df


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_execute_result(
    fetchone_val=None,
    fetchall_val: list | None = None,
) -> MagicMock:
    """Tạo mock kết quả trả về từ db.execute() với fetchone/fetchall tuỳ chỉnh."""
    result = MagicMock()
    result.fetchone.return_value = fetchone_val
    result.fetchall.return_value = fetchall_val if fetchall_val is not None else []
    return result


def _make_db(*execute_results) -> AsyncMock:
    """
    Tạo AsyncSession mock.

    Mỗi lần gọi `await db.execute(...)` sẽ trả về phần tử tiếp theo trong
    execute_results (theo thứ tự). Upsert call không cần result cụ thể — dùng
    MagicMock() mặc định.
    """
    db = AsyncMock()
    db.execute.side_effect = list(execute_results)
    return db


def _patch_httpx(client_mock: AsyncMock):
    """
    Tạo context manager patch cho httpx.AsyncClient.

    Trả về context manager patch để dùng trong `with` statement.
    """
    instance = MagicMock()
    instance.__aenter__ = AsyncMock(return_value=client_mock)
    instance.__aexit__ = AsyncMock(return_value=None)
    return patch("app.services.weather_service.httpx.AsyncClient", return_value=instance)


# Response JSON hợp lệ từ Open-Meteo với 3 ngày
_VALID_API_RESPONSE = {
    "daily": {
        "time": ["2026-04-20", "2026-04-21", "2026-04-22"],
        "temperature_2m_max": [32.1, 31.5, 30.0],
        "precipitation_sum": [0.0, 5.2, 1.1],
    }
}


# ---------------------------------------------------------------------------
# Tests: fetch_weather_for_branch
# ---------------------------------------------------------------------------

class TestFetchWeatherForBranch:
    """Tests cho hàm fetch_weather_for_branch()."""

    @pytest.mark.asyncio
    async def test_fetch_weather_no_coordinates(self) -> None:
        """
        Chi nhánh không có tọa độ (lat/lng NULL) → return False ngay lập tức.
        Không được gọi httpx dù bất kỳ lý do gì.
        """
        coord_result = _make_execute_result(fetchone_val=None)  # không tìm thấy tọa độ
        db = _make_db(coord_result)

        with patch("app.services.weather_service.httpx.AsyncClient") as mock_cls:
            result = await fetch_weather_for_branch("branch_no_coord", db)

        assert result is False
        mock_cls.assert_not_called()

    @pytest.mark.asyncio
    async def test_fetch_weather_cache_hit(self) -> None:
        """
        Đã có cache cho hôm nay → return True ngay, không gọi Open-Meteo API.
        Chỉ cần 2 db.execute: coord query + cache check.
        """
        coord_result = _make_execute_result(fetchone_val=(10.823, 106.629))
        cache_result = _make_execute_result(fetchone_val=(1,))  # cache tồn tại
        db = _make_db(coord_result, cache_result)

        with patch("app.services.weather_service.httpx.AsyncClient") as mock_cls:
            result = await fetch_weather_for_branch("branch_cached", db)

        assert result is True
        mock_cls.assert_not_called()

    @pytest.mark.asyncio
    async def test_fetch_weather_api_success(self) -> None:
        """
        Chưa có cache + API trả về JSON hợp lệ → UPSERT 3 ngày, return True.
        Kiểm tra: db.commit() được gọi, tổng db.execute = coord + cache + 3 upserts.
        """
        coord_result = _make_execute_result(fetchone_val=(10.823, 106.629))
        cache_result = _make_execute_result(fetchone_val=None)  # chưa có cache
        upsert_results = [MagicMock() for _ in range(3)]         # 3 ngày → 3 upsert
        db = _make_db(coord_result, cache_result, *upsert_results)

        mock_response = MagicMock()
        mock_response.json.return_value = _VALID_API_RESPONSE
        mock_response.raise_for_status = MagicMock()  # không raise

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response

        with _patch_httpx(mock_client):
            result = await fetch_weather_for_branch("branch_ok", db)

        assert result is True
        # coord + cache check + 3 upserts = 5 calls
        assert db.execute.call_count == 5
        db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_fetch_weather_api_timeout(self) -> None:
        """
        httpx raise TimeoutException → không crash, return False, ghi log warning.
        Weather service không được lan truyền exception ra ngoài.
        """
        coord_result = _make_execute_result(fetchone_val=(10.823, 106.629))
        cache_result = _make_execute_result(fetchone_val=None)
        db = _make_db(coord_result, cache_result)

        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.TimeoutException("timeout")

        with _patch_httpx(mock_client):
            result = await fetch_weather_for_branch("branch_timeout", db)

        assert result is False
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_fetch_weather_api_error_response(self) -> None:
        """
        API trả về HTTP 429 (rate limit) → raise_for_status() raise HTTPStatusError
        → return False, không crash.
        """
        coord_result = _make_execute_result(fetchone_val=(10.823, 106.629))
        cache_result = _make_execute_result(fetchone_val=None)
        db = _make_db(coord_result, cache_result)

        # Tạo HTTPStatusError giả lập status 429
        mock_request = MagicMock()
        mock_resp_obj = MagicMock()
        mock_resp_obj.status_code = 429

        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "429 Too Many Requests",
            request=mock_request,
            response=mock_resp_obj,
        )

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response

        with _patch_httpx(mock_client):
            result = await fetch_weather_for_branch("branch_ratelimit", db)

        assert result is False
        db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# Tests: get_weather_df
# ---------------------------------------------------------------------------

class TestGetWeatherDf:
    """Tests cho hàm get_weather_df()."""

    @pytest.mark.asyncio
    async def test_get_weather_df_returns_dataframe(self) -> None:
        """
        DB có rows thời tiết cho ngày yêu cầu → trả về DataFrame đúng cột và kiểu.
        Cột ds phải là datetime64, temperature và precipitation là float.
        """
        from datetime import date as dt

        # Rows giả lập từ weather_cache: (date, temperature, precipitation)
        rows = [
            (dt(2026, 4, 20), 32.1, 0.0),
            (dt(2026, 4, 21), 31.5, 5.2),
        ]
        query_result = _make_execute_result(fetchall_val=rows)
        db = AsyncMock()
        db.execute.return_value = query_result

        dates = [dt(2026, 4, 20), dt(2026, 4, 21)]
        df = await get_weather_df("branch_weather", dates, db)

        assert df is not None
        assert isinstance(df, pd.DataFrame)
        # Kiểm tra đủ 3 cột bắt buộc
        assert set(df.columns) >= {"ds", "temperature", "precipitation"}
        assert len(df) == 2
        # ds phải là datetime64
        assert pd.api.types.is_datetime64_any_dtype(df["ds"])
        # temperature và precipitation phải là số thực
        assert df["temperature"].dtype == float
        assert df["precipitation"].dtype == float

    @pytest.mark.asyncio
    async def test_get_weather_df_no_data(self) -> None:
        """
        DB không có dữ liệu weather cho ngày yêu cầu → trả về None.
        Caller có trách nhiệm xử lý None (weather là dữ liệu bổ sung, không bắt buộc).
        """
        from datetime import date as dt

        query_result = _make_execute_result(fetchall_val=[])  # không có rows
        db = AsyncMock()
        db.execute.return_value = query_result

        dates = [dt(2026, 4, 20)]
        result = await get_weather_df("branch_empty", dates, db)

        assert result is None

    @pytest.mark.asyncio
    async def test_get_weather_df_empty_dates_list(self) -> None:
        """
        Truyền dates=[] → return None ngay, không query DB.
        Guard clause ở đầu hàm tránh query vô nghĩa.
        """
        db = AsyncMock()

        result = await get_weather_df("branch_any", [], db)

        assert result is None
        db.execute.assert_not_called()
