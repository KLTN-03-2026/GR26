"""
Unit tests cho app/services/data_service.py.

Dùng AsyncMock để giả lập DB session — không cần PostgreSQL thật.
Mỗi test kiểm tra 1 hàm độc lập với data giả đơn giản.
"""

from __future__ import annotations

from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pandas as pd
import pytest

from app.services.data_service import (
    _build_and_fill,
    get_active_ingredients,
    get_active_tenants,
    get_branch_coordinates,
    get_current_stock,
    get_recent_consumption,
)

# Chỉ áp dụng asyncio mark cho class có async methods
# (TestBuildAndFill là sync — không cần mark)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_db(fetchall_rows=None, fetchone_row=None) -> AsyncMock:
    """Tạo mock AsyncSession trả về dữ liệu cho execute().fetchall() / fetchone()."""
    result_mock = MagicMock()
    result_mock.fetchall.return_value = fetchall_rows or []
    result_mock.fetchone.return_value = fetchone_row

    db = AsyncMock()
    db.execute = AsyncMock(return_value=result_mock)
    return db


def _named_row(**kwargs):
    """Tạo row giả có thể truy cập bằng tên cột (dùng MagicMock)."""
    row = MagicMock()
    for k, v in kwargs.items():
        setattr(row, k, v)
    # Hỗ trợ cả indexing row[0], row[1]
    row.__getitem__ = lambda self, i: list(kwargs.values())[i]
    return row


# ---------------------------------------------------------------------------
# Tests: get_active_tenants
# ---------------------------------------------------------------------------

pytestmark_async = pytest.mark.asyncio


@pytest.mark.asyncio
class TestGetActiveTenants:
    async def test_returns_tenant_ids(self):
        """Trả về list tenant_id khi có tenant ACTIVE."""
        rows = [("tenant-aaa",), ("tenant-bbb",)]
        db = _make_db(fetchall_rows=rows)

        result = await get_active_tenants(db)

        assert result == ["tenant-aaa", "tenant-bbb"]
        db.execute.assert_called_once()

    async def test_returns_empty_when_no_tenants(self):
        """Trả về list rỗng khi không có tenant."""
        db = _make_db(fetchall_rows=[])

        result = await get_active_tenants(db)

        assert result == []


# ---------------------------------------------------------------------------
# Tests: get_current_stock
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
class TestGetCurrentStock:
    async def test_returns_stock_when_found(self):
        """Trả về tồn kho khi tìm thấy record."""
        db = _make_db(fetchone_row=(15.5,))

        result = await get_current_stock(
            db,
            tenant_id="tenant-1",
            branch_id="branch-1",
            ingredient_id="ing-1",
        )

        assert result == 15.5

    async def test_returns_zero_when_not_found(self):
        """Trả về 0.0 khi không có record trong inventory_balances."""
        db = _make_db(fetchone_row=None)

        result = await get_current_stock(
            db,
            tenant_id="tenant-1",
            branch_id="branch-1",
            ingredient_id="ing-999",
        )

        assert result == 0.0

    async def test_always_filters_tenant_id(self):
        """Verify query có chứa tenant_id parameter — không query cross-tenant."""
        db = _make_db(fetchone_row=(5.0,))

        await get_current_stock(db, "my-tenant", "my-branch", "my-ing")

        # Lấy kwargs từ execute call đầu tiên
        _, kwargs = db.execute.call_args
        params = kwargs if kwargs else db.execute.call_args[0][1]
        # Kiểm tra tenant_id được truyền vào query
        assert "tenant_id" in str(db.execute.call_args)


# ---------------------------------------------------------------------------
# Tests: get_branch_coordinates
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
class TestGetBranchCoordinates:
    async def test_returns_coordinates_when_found(self):
        """Trả về (lat, lng) khi chi nhánh có tọa độ."""
        db = _make_db(fetchone_row=(10.7769, 106.7009))

        result = await get_branch_coordinates(db, "branch-hcm")

        assert result is not None
        lat, lng = result
        assert abs(lat - 10.7769) < 1e-4
        assert abs(lng - 106.7009) < 1e-4

    async def test_returns_none_when_branch_not_found(self):
        """Trả về None khi không tìm thấy chi nhánh."""
        db = _make_db(fetchone_row=None)

        result = await get_branch_coordinates(db, "branch-unknown")

        assert result is None

    async def test_returns_none_when_lat_lng_null(self):
        """Trả về None khi chi nhánh chưa cập nhật tọa độ."""
        db = _make_db(fetchone_row=(None, None))

        result = await get_branch_coordinates(db, "branch-no-coords")

        assert result is None


# ---------------------------------------------------------------------------
# Tests: get_recent_consumption
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
class TestGetRecentConsumption:
    async def test_returns_dataframe_with_correct_columns(self):
        """Trả về DataFrame [ds, y] khi có data trong consumption_history."""
        today = date.today()
        rows = [
            (today - timedelta(days=2), 10.5),
            (today - timedelta(days=1), 12.0),
            (today, 9.0),
        ]
        db = _make_db(fetchall_rows=rows)

        df = await get_recent_consumption(db, series_id="s1", days=14)

        assert list(df.columns) == ["ds", "y"]
        assert len(df) == 3
        assert df["y"].tolist() == [10.5, 12.0, 9.0]
        assert pd.api.types.is_datetime64_any_dtype(df["ds"])

    async def test_returns_empty_when_no_history(self):
        """Trả về DataFrame rỗng khi series chưa có history."""
        db = _make_db(fetchall_rows=[])

        df = await get_recent_consumption(db, series_id="s99", days=14)

        assert df.empty
        assert list(df.columns) == ["ds", "y"]

    async def test_raises_on_invalid_series_id(self):
        """Raise ValueError khi series_id không đúng format."""
        db = AsyncMock()

        with pytest.raises(ValueError, match="s\\{int\\}"):
            await get_recent_consumption(db, series_id="invalid", days=14)

        with pytest.raises(ValueError):
            await get_recent_consumption(db, series_id="sXYZ", days=14)

    async def test_parses_series_id_correctly(self):
        """Verify parse "s42" → 42 và truyền đúng vào query."""
        db = _make_db(fetchall_rows=[])

        await get_recent_consumption(db, series_id="s42", days=7)

        # Verify execute được gọi với series_pk=42
        call_args = db.execute.call_args
        params = call_args[0][1]
        assert params["series_pk"] == 42


# ---------------------------------------------------------------------------
# Tests: get_active_ingredients
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
class TestGetActiveIngredients:
    async def test_returns_ingredients_with_series_id(self):
        """Trả về list ingredients kèm series_id khi đã có trong registry."""
        ing_id = "aaaa-bbbb-cccc-dddd"
        branch_id = "1111-2222-3333-4444"

        items_rows = [
            _named_row(ingredient_id=ing_id, name="Bột mì", unit="kg"),
        ]
        db = _make_db(fetchall_rows=items_rows)

        # Mock SeriesRegistryRepo
        mock_registry = MagicMock()
        mock_registry.ingredient_id = ing_id
        mock_registry.series_id = "s5"

        with patch(
            "app.services.data_service.SeriesRegistryRepo"
        ) as MockRepo:
            mock_repo_instance = AsyncMock()
            mock_repo_instance.get_all_by_branch.return_value = [mock_registry]
            MockRepo.return_value = mock_repo_instance

            result = await get_active_ingredients(db, "tenant-x", branch_id)

        assert len(result) == 1
        assert result[0]["id"] == ing_id
        assert result[0]["name"] == "Bột mì"
        assert result[0]["unit"] == "kg"
        assert result[0]["series_id"] == "s5"

    async def test_returns_none_series_id_when_not_in_registry(self):
        """series_id = None cho ingredient chưa có trong registry (chưa train)."""
        ing_id = "new-ingredient-id"
        branch_id = "some-branch"

        items_rows = [
            _named_row(ingredient_id=ing_id, name="Sữa tươi", unit="ml"),
        ]
        db = _make_db(fetchall_rows=items_rows)

        with patch(
            "app.services.data_service.SeriesRegistryRepo"
        ) as MockRepo:
            mock_repo_instance = AsyncMock()
            mock_repo_instance.get_all_by_branch.return_value = []  # Registry rỗng
            MockRepo.return_value = mock_repo_instance

            result = await get_active_ingredients(db, "tenant-x", branch_id)

        assert result[0]["series_id"] is None

    async def test_returns_empty_when_no_ingredients(self):
        """Trả về list rỗng khi chi nhánh chưa có nguyên liệu."""
        db = _make_db(fetchall_rows=[])

        result = await get_active_ingredients(db, "tenant-x", "empty-branch")

        assert result == []


# ---------------------------------------------------------------------------
# Tests: _build_and_fill (pure function — không cần mock DB)
# ---------------------------------------------------------------------------

class TestBuildAndFill:
    def test_fills_missing_days_with_zero(self):
        """Ngày không có data phải được điền y=0."""
        today = date.today()
        start = today - timedelta(days=4)

        # Chỉ có dữ liệu cho ngày đầu và ngày cuối — 3 ngày giữa bị thiếu
        day_rows = [
            (start, 10.0),
            (today, 8.0),
        ]

        df = _build_and_fill(day_rows, start, series_id="s7")

        # Phải có đủ 5 ngày (start → today inclusive)
        assert len(df) == 5

        # Ngày có data phải đúng
        assert df.loc[df["ds"] == pd.Timestamp(start), "y"].values[0] == 10.0
        assert df.loc[df["ds"] == pd.Timestamp(today), "y"].values[0] == 8.0

        # 3 ngày giữa phải là 0
        middle = df.iloc[1:-1]
        assert (middle["y"] == 0.0).all()

    def test_series_id_assigned_to_all_rows(self):
        """Tất cả rows phải có cùng ID = series_id."""
        start = date.today() - timedelta(days=2)
        day_rows = [(start, 5.0), (date.today(), 3.0)]

        df = _build_and_fill(day_rows, start, series_id="s42")

        assert (df["ID"] == "s42").all()

    def test_returns_empty_for_no_data(self):
        """Trả về DataFrame rỗng khi không có raw data."""
        df = _build_and_fill([], date.today(), series_id="s1")

        assert df.empty

    def test_ds_column_is_datetime(self):
        """Cột ds phải là datetime — yêu cầu của NeuralProphet."""
        start = date.today() - timedelta(days=3)
        day_rows = [(start, 7.0)]

        df = _build_and_fill(day_rows, start, series_id="s1")

        assert pd.api.types.is_datetime64_any_dtype(df["ds"])

    def test_no_negative_y_values(self):
        """y không bao giờ âm — tiêu thụ không âm."""
        start = date.today() - timedelta(days=5)
        day_rows = [(start, 10.0)]

        df = _build_and_fill(day_rows, start, series_id="s1")

        assert (df["y"] >= 0).all()
