"""
Tests cho app/services/predict_service.py

Dùng AsyncMock + patch để giả lập DB session, model I/O và data service.
Không cần PostgreSQL thật, không cần NeuralProphet thật.

Lưu ý quan trọng về behavior hiện tại (Option C):
  - Nếu branch chưa có model → predict_branch() trả về [] ngay lập tức
  - Không dùng fallback moving average ở cấp branch
  - Fallback moving average vẫn hoạt động ở cấp ingredient:
    khi model.predict() thất bại hoặc history rỗng

Chạy: pytest tests/test_predict_service.py -v
"""

from __future__ import annotations

from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pandas as pd
import pytest

from app.services.predict_service import (
    _build_fallback_forecast,
    predict_all_branches,
    predict_branch,
)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _make_history_df(n_days: int = 14, avg: float = 10.0) -> pd.DataFrame:
    """Tạo DataFrame lịch sử tiêu thụ đủ n_lags rows."""
    dates = pd.date_range(
        end=date.today() - timedelta(days=1), periods=n_days, freq="D"
    )
    return pd.DataFrame({"ds": dates, "y": [avg] * n_days})


def _make_db() -> AsyncMock:
    """Tạo mock AsyncSession với execute và commit là AsyncMock."""
    db = AsyncMock()
    db.execute = AsyncMock(return_value=MagicMock())
    db.commit = AsyncMock()
    db.flush = AsyncMock()
    return db


def _make_series_entry(series_int_id: int = 1) -> MagicMock:
    """Tạo mock AiSeriesRegistry với id và series_id property."""
    entry = MagicMock()
    entry.id = series_int_id
    entry.series_id = f"s{series_int_id}"
    return entry


def _make_mock_model(history_df: pd.DataFrame, yhat_value: float = 5.0) -> MagicMock:
    """
    Tạo mock NeuralProphet model với predict() trả về DataFrame hợp lệ.

    Output gồm history rows + 7 future rows.
    Mỗi row trong history có cột yhat1 = yhat_value.
    predict_service đọc yhat1..yhat{n} từ row lịch sử cuối cùng —
    các cột yhat2..yhat{n} không tồn tại trong mock sẽ được pd.Series.get()
    trả về None, sau đó fill-logic thay bằng fallback_mean = yhat_value.
    """
    model = MagicMock()
    last_date = history_df["ds"].max()
    future_dates = pd.date_range(
        start=last_date + pd.Timedelta(days=1), periods=7, freq="D"
    )
    all_dates = pd.concat([
        history_df["ds"],
        pd.Series(future_dates),
    ]).reset_index(drop=True)
    yhat1_values = [yhat_value] * len(all_dates)

    model.predict.return_value = pd.DataFrame({
        "ds": all_dates,
        "yhat1": yhat1_values,
    })
    return model


def _sample_ingredients() -> list[dict]:
    return [
        {"id": "ing-uuid-001", "name": "Bột mì", "unit": "kg"},
        {"id": "ing-uuid-002", "name": "Đường", "unit": "kg"},
    ]


# ─────────────────────────────────────────────────────────────────────────────
# _build_fallback_forecast
# ─────────────────────────────────────────────────────────────────────────────

class TestBuildFallbackForecast:
    def test_returns_7_rows(self):
        """Luôn trả về đúng 7 rows bất kể history."""
        result = _build_fallback_forecast(_make_history_df(14))
        assert len(result) == 7

    def test_output_has_ds_and_yhat1_columns(self):
        result = _build_fallback_forecast(_make_history_df(14))
        assert "ds" in result.columns
        assert "yhat1" in result.columns

    def test_yhat1_equals_avg_of_last_7_days(self):
        """yhat1 phải bằng trung bình 7 ngày gần nhất."""
        history = pd.DataFrame({
            "ds": pd.date_range(end=date.today() - timedelta(days=1), periods=10, freq="D"),
            "y": [2.0] * 3 + [10.0] * 7,  # 3 ngày cũ + 7 ngày gần nhất
        })
        result = _build_fallback_forecast(history)
        # avg của 7 ngày gần nhất = 10.0
        assert all(v == 10.0 for v in result["yhat1"])

    def test_empty_history_returns_zero_yhat1(self):
        """Không có history → yhat1 = 0.0 (không có thông tin tham chiếu)."""
        result = _build_fallback_forecast(pd.DataFrame(columns=["ds", "y"]))
        assert len(result) == 7
        assert all(v == 0.0 for v in result["yhat1"])

    def test_future_dates_start_tomorrow(self):
        """Ngày đầu tiên phải là ngày mai."""
        result = _build_fallback_forecast(_make_history_df(14))
        first_date = result["ds"].iloc[0].date()
        assert first_date == date.today() + timedelta(days=1)

    def test_ds_is_datetime(self):
        result = _build_fallback_forecast(_make_history_df(7))
        assert pd.api.types.is_datetime64_any_dtype(result["ds"])

    def test_history_shorter_than_7_uses_all(self):
        """Lịch sử < 7 ngày → dùng trung bình tất cả."""
        history = pd.DataFrame({
            "ds": pd.date_range(end=date.today() - timedelta(days=1), periods=3, freq="D"),
            "y": [6.0, 9.0, 3.0],
        })
        result = _build_fallback_forecast(history)
        expected_avg = (6.0 + 9.0 + 3.0) / 3
        assert all(abs(v - expected_avg) < 1e-9 for v in result["yhat1"])


# ─────────────────────────────────────────────────────────────────────────────
# predict_branch — no model (Option C)
# ─────────────────────────────────────────────────────────────────────────────

class TestPredictBranchFallback:
    """
    Kiểm tra behavior khi branch chưa có model (Option C).

    Option C: không predict, không ghi DB, trả về list rỗng ngay lập tức.
    Fallback moving average vẫn hoạt động ở cấp ingredient khi model.predict() lỗi.
    """
    pytestmark = pytest.mark.asyncio

    @patch("app.services.predict_service.SeriesRegistryRepo")
    @patch("app.services.predict_service.data_service")
    @patch("app.services.predict_service.model_io")
    async def test_no_model_returns_empty_list(
        self, mock_model_io, mock_data_svc, mock_series_repo_cls
    ):
        """Branch chưa có model → Option C: skip ngay, trả về [] không gọi gì thêm."""
        mock_model_io.model_exists.return_value = False

        db = _make_db()
        results = await predict_branch("tenant-1", "branch-1", db)

        assert results == []
        # Không load model, không lấy ingredients khi chưa có model
        mock_model_io.load_model.assert_not_called()
        mock_data_svc.get_all_ingredients_of_branch.assert_not_called()

    @patch("app.services.predict_service.SeriesRegistryRepo")
    @patch("app.services.predict_service.data_service")
    @patch("app.services.predict_service.model_io")
    async def test_fallback_sets_correct_schema_fields(
        self, mock_model_io, mock_data_svc, mock_series_repo_cls
    ):
        """Model predict() thất bại → fallback per-ingredient, kết quả vẫn đủ trường schema."""
        history_df = _make_history_df(14, avg=5.0)
        mock_model = MagicMock()
        mock_model.predict.side_effect = RuntimeError("NaN in model input")

        mock_model_io.model_exists.return_value = True
        mock_model_io.get_model_config.return_value = {"n_forecasts": 7, "n_lags": 14}
        mock_model_io.load_model.return_value = mock_model

        mock_data_svc.get_all_ingredients_of_branch = AsyncMock(
            return_value=[{"id": "ing-001", "name": "Bột mì", "unit": "kg"}]
        )
        mock_data_svc.get_ingredient_consumption = AsyncMock(return_value=history_df)
        mock_data_svc.get_current_stock = AsyncMock(return_value=20.0)

        mock_repo = AsyncMock()
        mock_repo.get_or_create = AsyncMock(return_value=_make_series_entry(5))
        mock_series_repo_cls.return_value = mock_repo

        results = await predict_branch("tenant-1", "branch-1", _make_db())

        assert len(results) == 1
        r = results[0]
        assert r.ingredient_id == "ing-001"
        assert r.ingredient_name == "Bột mì"
        assert r.unit == "kg"
        assert r.current_stock == 20.0
        assert isinstance(r.suggested_order_qty, float)
        assert isinstance(r.suggested_order_date, date)
        assert r.urgency in {"ok", "warning", "critical"}
        assert r.is_fallback is True


# ─────────────────────────────────────────────────────────────────────────────
# predict_branch — with model
# ─────────────────────────────────────────────────────────────────────────────

class TestPredictBranchWithModel:
    pytestmark = pytest.mark.asyncio

    @patch("app.services.predict_service.SeriesRegistryRepo")
    @patch("app.services.predict_service.data_service")
    @patch("app.services.predict_service.model_io")
    async def test_uses_model_when_exists(
        self, mock_model_io, mock_data_svc, mock_series_repo_cls
    ):
        """Khi có model → model.predict() được gọi, is_fallback=False."""
        history_df = _make_history_df(20, avg=6.0)
        mock_model = _make_mock_model(history_df, yhat_value=6.0)

        mock_model_io.model_exists.return_value = True
        mock_model_io.get_model_config.return_value = {"n_forecasts": 7, "n_lags": 14}
        mock_model_io.load_model.return_value = mock_model

        mock_data_svc.get_all_ingredients_of_branch = AsyncMock(
            return_value=[{"id": "ing-001", "name": "Cà phê", "unit": "kg"}]
        )
        mock_data_svc.get_ingredient_consumption = AsyncMock(return_value=history_df)
        mock_data_svc.get_current_stock = AsyncMock(return_value=100.0)

        mock_repo = AsyncMock()
        mock_repo.get_or_create = AsyncMock(return_value=_make_series_entry(3))
        mock_series_repo_cls.return_value = mock_repo

        results = await predict_branch("tenant-1", "branch-1", _make_db())

        assert len(results) == 1
        assert results[0].is_fallback is False
        mock_model.predict.assert_called_once()

    @patch("app.services.predict_service.SeriesRegistryRepo")
    @patch("app.services.predict_service.data_service")
    @patch("app.services.predict_service.model_io")
    async def test_falls_back_when_model_predict_raises(
        self, mock_model_io, mock_data_svc, mock_series_repo_cls
    ):
        """model.predict() raise exception → tự động dùng fallback, is_fallback=True."""
        history_df = _make_history_df(20, avg=5.0)
        mock_model = MagicMock()
        mock_model.predict.side_effect = RuntimeError("NaN detected in model input")

        mock_model_io.model_exists.return_value = True
        mock_model_io.get_model_config.return_value = {"n_forecasts": 7, "n_lags": 14}
        mock_model_io.load_model.return_value = mock_model

        mock_data_svc.get_all_ingredients_of_branch = AsyncMock(
            return_value=[{"id": "ing-001", "name": "Sữa", "unit": "lít"}]
        )
        mock_data_svc.get_ingredient_consumption = AsyncMock(return_value=history_df)
        mock_data_svc.get_current_stock = AsyncMock(return_value=30.0)

        mock_repo = AsyncMock()
        mock_repo.get_or_create = AsyncMock(return_value=_make_series_entry(7))
        mock_series_repo_cls.return_value = mock_repo

        results = await predict_branch("tenant-1", "branch-1", _make_db())

        # Không raise — chuyển sang fallback
        assert len(results) == 1
        assert results[0].is_fallback is True

    @patch("app.services.predict_service.SeriesRegistryRepo")
    @patch("app.services.predict_service.data_service")
    @patch("app.services.predict_service.model_io")
    async def test_falls_back_when_history_empty_even_with_model(
        self, mock_model_io, mock_data_svc, mock_series_repo_cls
    ):
        """History rỗng (nguyên liệu mới) → fallback dù có model."""
        mock_model_io.model_exists.return_value = True
        mock_model_io.load_model.return_value = MagicMock()

        mock_data_svc.get_all_ingredients_of_branch = AsyncMock(
            return_value=[{"id": "ing-new", "name": "Nguyên liệu mới", "unit": "g"}]
        )
        mock_data_svc.get_ingredient_consumption = AsyncMock(
            return_value=pd.DataFrame(columns=["ds", "y"])  # rỗng
        )
        mock_data_svc.get_current_stock = AsyncMock(return_value=0.0)

        mock_repo = AsyncMock()
        mock_repo.get_or_create = AsyncMock(return_value=_make_series_entry(9))
        mock_series_repo_cls.return_value = mock_repo

        results = await predict_branch("tenant-1", "branch-1", _make_db())

        assert len(results) == 1
        assert results[0].is_fallback is True


# ─────────────────────────────────────────────────────────────────────────────
# predict_branch — edge cases
# ─────────────────────────────────────────────────────────────────────────────

class TestPredictBranchEdgeCases:
    pytestmark = pytest.mark.asyncio

    @patch("app.services.predict_service.SeriesRegistryRepo")
    @patch("app.services.predict_service.data_service")
    @patch("app.services.predict_service.model_io")
    async def test_empty_ingredients_returns_empty_list(
        self, mock_model_io, mock_data_svc, mock_series_repo_cls
    ):
        """Không có nguyên liệu → trả về list rỗng, không lỗi."""
        # Khi không có model (Option C) cũng trả về []
        mock_model_io.model_exists.return_value = False
        mock_data_svc.get_all_ingredients_of_branch = AsyncMock(return_value=[])
        mock_series_repo_cls.return_value = AsyncMock()

        results = await predict_branch("tenant-1", "empty-branch", _make_db())

        assert results == []

    @patch("app.services.predict_service.SeriesRegistryRepo")
    @patch("app.services.predict_service.data_service")
    @patch("app.services.predict_service.model_io")
    async def test_exception_on_one_ingredient_skips_it(
        self, mock_model_io, mock_data_svc, mock_series_repo_cls
    ):
        """Lỗi ở ingredient thứ nhất → bỏ qua, vẫn process ingredient thứ hai."""
        history_df = _make_history_df(14, avg=3.0)
        mock_model = _make_mock_model(history_df, yhat_value=3.0)

        mock_model_io.model_exists.return_value = True
        mock_model_io.get_model_config.return_value = {"n_forecasts": 7, "n_lags": 14}
        mock_model_io.load_model.return_value = mock_model

        mock_data_svc.get_all_ingredients_of_branch = AsyncMock(
            return_value=[
                {"id": "ing-fail", "name": "Lỗi", "unit": "kg"},
                {"id": "ing-ok",   "name": "OK",   "unit": "g"},
            ]
        )
        mock_data_svc.get_ingredient_consumption = AsyncMock(return_value=history_df)
        mock_data_svc.get_current_stock = AsyncMock(return_value=10.0)

        # ingredient đầu tiên gây lỗi ở bước get_or_create
        mock_repo = AsyncMock()
        mock_repo.get_or_create = AsyncMock(
            side_effect=[
                RuntimeError("Registry error"),  # ing-fail bị lỗi
                _make_series_entry(1),            # ing-ok thành công
            ]
        )
        mock_series_repo_cls.return_value = mock_repo

        results = await predict_branch("tenant-1", "branch-1", _make_db())

        # Chỉ ingredient OK được xử lý thành công
        assert len(results) == 1
        assert results[0].ingredient_name == "OK"

    @patch("app.services.predict_service.SeriesRegistryRepo")
    @patch("app.services.predict_service.data_service")
    @patch("app.services.predict_service.model_io")
    async def test_commits_db_at_end(
        self, mock_model_io, mock_data_svc, mock_series_repo_cls
    ):
        """db.commit() phải được gọi sau khi xử lý xong tất cả ingredients."""
        history_df = _make_history_df(14)
        mock_model = _make_mock_model(history_df, yhat_value=5.0)

        mock_model_io.model_exists.return_value = True
        mock_model_io.get_model_config.return_value = {"n_forecasts": 7, "n_lags": 14}
        mock_model_io.load_model.return_value = mock_model

        mock_data_svc.get_all_ingredients_of_branch = AsyncMock(
            return_value=[{"id": "ing-001", "name": "Test", "unit": "kg"}]
        )
        mock_data_svc.get_ingredient_consumption = AsyncMock(return_value=history_df)
        mock_data_svc.get_current_stock = AsyncMock(return_value=5.0)

        mock_repo = AsyncMock()
        mock_repo.get_or_create = AsyncMock(return_value=_make_series_entry(2))
        mock_series_repo_cls.return_value = mock_repo

        db = _make_db()
        await predict_branch("tenant-1", "branch-1", db)

        db.commit.assert_awaited_once()

    @patch("app.services.predict_service.SeriesRegistryRepo")
    @patch("app.services.predict_service.data_service")
    @patch("app.services.predict_service.model_io")
    async def test_upserts_forecast_results_for_each_ingredient(
        self, mock_model_io, mock_data_svc, mock_series_repo_cls
    ):
        """db.execute phải được gọi cho mỗi ingredient: 1 DELETE + 7 INSERT."""
        history_df = _make_history_df(14, avg=4.0)
        mock_model = _make_mock_model(history_df, yhat_value=4.0)

        mock_model_io.model_exists.return_value = True
        mock_model_io.get_model_config.return_value = {"n_forecasts": 7, "n_lags": 14}
        mock_model_io.load_model.return_value = mock_model

        mock_data_svc.get_all_ingredients_of_branch = AsyncMock(
            return_value=_sample_ingredients()  # 2 ingredients
        )
        mock_data_svc.get_ingredient_consumption = AsyncMock(
            return_value=history_df
        )
        mock_data_svc.get_current_stock = AsyncMock(return_value=50.0)

        mock_repo = AsyncMock()
        mock_repo.get_or_create = AsyncMock(return_value=_make_series_entry(1))
        mock_series_repo_cls.return_value = mock_repo

        db = _make_db()
        results = await predict_branch("tenant-1", "branch-1", db)

        assert len(results) == 2
        # Mỗi ingredient: 1 DELETE forecast cũ + 7 INSERT/UPSERT rows = 8 calls
        assert db.execute.await_count == 16

    @patch("app.services.predict_service.SeriesRegistryRepo")
    @patch("app.services.predict_service.data_service")
    @patch("app.services.predict_service.model_io")
    async def test_critical_urgency_when_stock_is_zero(
        self, mock_model_io, mock_data_svc, mock_series_repo_cls
    ):
        """Tồn kho = 0 → stockout hôm nay → urgency = critical."""
        history_df = _make_history_df(14, avg=5.0)
        mock_model = _make_mock_model(history_df, yhat_value=5.0)

        mock_model_io.model_exists.return_value = True
        mock_model_io.get_model_config.return_value = {"n_forecasts": 7, "n_lags": 14}
        mock_model_io.load_model.return_value = mock_model

        mock_data_svc.get_all_ingredients_of_branch = AsyncMock(
            return_value=[{"id": "ing-001", "name": "Hết kho", "unit": "kg"}]
        )
        mock_data_svc.get_ingredient_consumption = AsyncMock(return_value=history_df)
        mock_data_svc.get_current_stock = AsyncMock(return_value=0.0)

        mock_repo = AsyncMock()
        mock_repo.get_or_create = AsyncMock(return_value=_make_series_entry(1))
        mock_series_repo_cls.return_value = mock_repo

        results = await predict_branch("tenant-1", "branch-1", _make_db())

        assert results[0].urgency == "critical"
        assert results[0].stockout_date == date.today()

    @patch("app.services.predict_service.SeriesRegistryRepo")
    @patch("app.services.predict_service.data_service")
    @patch("app.services.predict_service.model_io")
    async def test_extrapolates_stockout_after_forecast_window(
        self, mock_model_io, mock_data_svc, mock_series_repo_cls
    ):
        """
        Tồn kho dư nhẹ sau 7 ngày → ngày stockout được ước tính ngoài forecast window.

        stock=45, avg=5/ngày → 7 ngày dùng 35 → còn dư 10 → hết sau 2 ngày thêm.
        stockout_date = today+7+2 = today+9
        suggested_order_date = today+9 - lead_time(2) = today+7
        suggested_order_qty = max(35*1.2 - 45, 0) = 0.0
        """
        history_df = _make_history_df(14, avg=5.0)
        mock_model = _make_mock_model(history_df, yhat_value=5.0)

        mock_model_io.model_exists.return_value = True
        mock_model_io.get_model_config.return_value = {"n_forecasts": 7, "n_lags": 14}
        mock_model_io.load_model.return_value = mock_model

        mock_data_svc.get_all_ingredients_of_branch = AsyncMock(
            return_value=[{"id": "ing-001", "name": "Sắp hết", "unit": "kg"}]
        )
        mock_data_svc.get_recent_consumption = AsyncMock(return_value=history_df)
        mock_data_svc.get_ingredient_consumption = AsyncMock(return_value=history_df)
        mock_data_svc.get_current_stock = AsyncMock(return_value=45.0)

        mock_repo = AsyncMock()
        mock_repo.get_or_create = AsyncMock(return_value=_make_series_entry(1))
        mock_series_repo_cls.return_value = mock_repo

        results = await predict_branch("tenant-1", "branch-1", _make_db())

        assert results[0].stockout_date == date.today() + timedelta(days=9)
        assert results[0].suggested_order_date == date.today() + timedelta(days=7)
        assert results[0].suggested_order_qty == 0.0

    @patch("app.services.predict_service.SeriesRegistryRepo")
    @patch("app.services.predict_service.data_service")
    @patch("app.services.predict_service.model_io")
    async def test_ok_urgency_when_stock_very_large(
        self, mock_model_io, mock_data_svc, mock_series_repo_cls
    ):
        """Tồn kho rất lớn → sẽ hết rất lâu nữa (vượt forecast window) → urgency = ok."""
        history_df = _make_history_df(14, avg=5.0)
        mock_model = _make_mock_model(history_df, yhat_value=5.0)

        mock_model_io.model_exists.return_value = True
        mock_model_io.get_model_config.return_value = {"n_forecasts": 7, "n_lags": 14}
        mock_model_io.load_model.return_value = mock_model

        mock_data_svc.get_all_ingredients_of_branch = AsyncMock(
            return_value=[{"id": "ing-001", "name": "Đủ hàng", "unit": "kg"}]
        )
        mock_data_svc.get_ingredient_consumption = AsyncMock(return_value=history_df)
        mock_data_svc.get_current_stock = AsyncMock(return_value=999_999.0)

        mock_repo = AsyncMock()
        mock_repo.get_or_create = AsyncMock(return_value=_make_series_entry(1))
        mock_series_repo_cls.return_value = mock_repo

        results = await predict_branch("tenant-1", "branch-1", _make_db())

        # Tồn kho rất lớn → days_until >> n_forecasts=7 → urgency ok
        assert results[0].urgency == "ok"


# ─────────────────────────────────────────────────────────────────────────────
# predict_all_branches
# ─────────────────────────────────────────────────────────────────────────────

class TestPredictAllBranches:
    pytestmark = pytest.mark.asyncio

    @patch("app.services.predict_service.predict_branch")
    @patch("app.services.predict_service.data_service")
    async def test_calls_predict_branch_for_each_branch(
        self, mock_data_svc, mock_predict_branch
    ):
        """predict_branch phải được gọi đúng số lần: 2 tenant × 2 branch = 4 lần."""
        mock_data_svc.get_all_active_tenants = AsyncMock(
            return_value=["tenant-a", "tenant-b"]
        )
        mock_data_svc.get_all_active_branches = AsyncMock(
            return_value=[
                {"id": "branch-1", "name": "Chi nhánh 1"},
                {"id": "branch-2", "name": "Chi nhánh 2"},
            ]
        )
        mock_predict_branch.return_value = [MagicMock(), MagicMock()]

        await predict_all_branches(_make_db())

        assert mock_predict_branch.await_count == 4

    @patch("app.services.predict_service.predict_branch")
    @patch("app.services.predict_service.data_service")
    async def test_no_tenants_returns_without_error(
        self, mock_data_svc, mock_predict_branch
    ):
        """Không có tenant active → kết thúc bình thường, không gọi predict_branch."""
        mock_data_svc.get_all_active_tenants = AsyncMock(return_value=[])

        await predict_all_branches(_make_db())

        mock_predict_branch.assert_not_called()

    @patch("app.services.predict_service.predict_branch")
    @patch("app.services.predict_service.data_service")
    async def test_exception_in_one_branch_continues_others(
        self, mock_data_svc, mock_predict_branch
    ):
        """predict_branch lỗi ở 1 branch → các branch khác vẫn được xử lý."""
        mock_data_svc.get_all_active_tenants = AsyncMock(return_value=["tenant-a"])
        mock_data_svc.get_all_active_branches = AsyncMock(
            return_value=[
                {"id": "branch-fail", "name": "Lỗi"},
                {"id": "branch-ok",   "name": "OK"},
            ]
        )
        mock_predict_branch.side_effect = [
            RuntimeError("DB connection lost"),  # branch-fail
            [],                                   # branch-ok → OK
        ]

        # Không raise ra ngoài
        await predict_all_branches(_make_db())

        assert mock_predict_branch.await_count == 2
