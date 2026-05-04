"""
Tests cho app/services/train_service.py

Kiểm tra 3 tầng:
1. _filter_valid_series() — lọc per-series theo MIN_DAYS_REQUIRED
2. run_train_for_branch() — quy trình train 1 branch (mock deps nặng)
3. _build_neuralprophet_model() — kiểm tra seed 42 được đặt
4. run_train_all_tenants() — resilience khi 1 branch thất bại

NeuralProphet KHÔNG được chạy thật trong bất kỳ test nào (tốn ~10s/call).
Tất cả I/O với DB đều dùng AsyncMock.
"""

from datetime import date
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pandas as pd
import pytest

from app.services.train_service import (
    _build_neuralprophet_model,
    _filter_valid_series,
    run_train_all_tenants,
    run_train_for_branch,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_df(series_spec: dict[str, int]) -> pd.DataFrame:
    """
    Tạo DataFrame train với nhiều series, mỗi series có số ngày tuỳ chỉnh.

    Args:
        series_spec: {"series_id": n_days} — ID của series và số ngày dữ liệu.

    Returns:
        DataFrame với cột [ds, y, ID] đúng chuẩn NeuralProphet.
    """
    rows = []
    base = pd.Timestamp("2025-01-01")
    for sid, n_days in series_spec.items():
        for i in range(n_days):
            rows.append({
                "ds": base + pd.Timedelta(days=i),
                "y": 10.0 + (i % 3),   # giá trị dương, không NaN
                "ID": sid,
            })
    if not rows:
        return pd.DataFrame(columns=["ds", "y", "ID"])
    df = pd.DataFrame(rows)
    df["ds"] = pd.to_datetime(df["ds"])
    return df


def _make_db() -> AsyncMock:
    """Tạo AsyncSession mock đủ để run_train_for_branch không bị lỗi."""
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.commit = AsyncMock()
    db.execute = AsyncMock()
    return db


def _train_branch_success_result() -> dict:
    """Kết quả giả lập từ train_branch_model() khi train thành công."""
    return {
        "mae": 2.345,
        "mape": 8.7,
        "model_path": "storage/models/tenant_1/branch_1/model.np",
        "series_count": 2,
        "series_skipped": [],
    }


# ---------------------------------------------------------------------------
# TestFilterValidSeries
# ---------------------------------------------------------------------------

class TestFilterValidSeries:
    """Tests cho _filter_valid_series() — lọc series theo ngưỡng MIN_DAYS_REQUIRED."""

    def test_filter_valid_series_all_sufficient(self) -> None:
        """
        2 series, mỗi series 60 ngày (≥ 30) → không có series nào bị loại.
        skipped_ids phải là danh sách rỗng.
        """
        df = _make_df({"s_A": 60, "s_B": 60})

        df_filtered, skipped_ids = _filter_valid_series(df)

        assert df_filtered["ID"].nunique() == 2
        assert skipped_ids == []

    def test_filter_valid_series_some_insufficient(self) -> None:
        """
        Series A có 60 ngày (đủ), series B có 10 ngày (thiếu < 30).
        Kỳ vọng: B bị loại, "s_B" xuất hiện trong skipped_ids.
        """
        df = _make_df({"s_A": 60, "s_B": 10})

        df_filtered, skipped_ids = _filter_valid_series(df)

        # Chỉ giữ lại s_A
        assert df_filtered["ID"].nunique() == 1
        assert "s_A" in df_filtered["ID"].values
        # s_B bị đưa vào skipped
        assert "s_B" in skipped_ids
        assert "s_A" not in skipped_ids

    def test_filter_valid_series_all_insufficient(self) -> None:
        """
        Tất cả series đều < 30 ngày → df_filtered rỗng, tất cả IDs trong skipped.
        """
        df = _make_df({"s_X": 5, "s_Y": 15, "s_Z": 29})

        df_filtered, skipped_ids = _filter_valid_series(df)

        assert df_filtered.empty
        assert sorted(skipped_ids) == ["s_X", "s_Y", "s_Z"]

    def test_filter_valid_series_exact_boundary(self) -> None:
        """
        Series có đúng MIN_DAYS_REQUIRED (30) ngày → được giữ lại (không bị skip).
        Boundary condition: >= 30 là đủ.
        """
        df = _make_df({"s_border": 30, "s_below": 29})

        df_filtered, skipped_ids = _filter_valid_series(df)

        assert "s_border" in df_filtered["ID"].values
        assert "s_below" in skipped_ids
        assert "s_border" not in skipped_ids


# ---------------------------------------------------------------------------
# TestRunTrainForBranch
# ---------------------------------------------------------------------------

class TestRunTrainForBranch:
    """Tests cho run_train_for_branch() — quy trình train đầy đủ 1 branch."""

    @pytest.mark.asyncio
    async def test_run_train_for_branch_success(self) -> None:
        """
        Mock toàn bộ deps: config, active_days, consumption data, train_branch_model.
        Kỳ vọng: status=success, series_count đúng, series_skipped=[], model_io được gọi.
        """
        db = _make_db()
        config = {
            "n_forecasts": 7,
            "epochs": 100,
            "weekly_seasonality": True,
            "start_date": None,
        }
        activity = {"active_days": 90}
        df_valid = _make_df({"s_1": 60, "s_2": 60})

        with (
            patch(
                "app.services.train_service.get_branch_train_config",
                AsyncMock(return_value=config),
            ),
            patch(
                "app.services.train_service.get_branch_active_days",
                AsyncMock(return_value=activity),
            ),
            patch(
                "app.services.train_service.get_consumption_for_branch",
                AsyncMock(return_value=df_valid),
            ),
            patch(
                "app.services.train_service.train_branch_model",
                return_value=_train_branch_success_result(),
            ) as mock_train,
            patch(
                "app.services.train_service._register_branch_model",
                AsyncMock(return_value=None),
            ),
        ):
            result = await run_train_for_branch(db, "tenant_1", "branch_1")

        assert result["status"] == "success"
        assert result["series_count"] == 2
        assert result["series_skipped"] == []
        assert result["error_message"] is None
        mock_train.assert_called_once()
        db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_run_train_for_branch_all_series_too_short(self) -> None:
        """
        Data tiêu thụ trả về toàn series < 30 ngày.
        _filter_valid_series lọc hết → validate_training_data raise ValueError
        → run_train_for_branch bắt lỗi → status=failed, không crash.

        Lưu ý: không có status="skipped" ở level này — lỗi dữ liệu → status="failed".
        """
        db = _make_db()
        config = {
            "n_forecasts": 7,
            "epochs": 100,
            "weekly_seasonality": True,
            "start_date": None,
        }
        activity = {"active_days": 10}
        df_short = _make_df({"s_1": 5, "s_2": 10})  # tất cả < 30 ngày

        with (
            patch(
                "app.services.train_service.get_branch_train_config",
                AsyncMock(return_value=config),
            ),
            patch(
                "app.services.train_service.get_branch_active_days",
                AsyncMock(return_value=activity),
            ),
            patch(
                "app.services.train_service.get_consumption_for_branch",
                AsyncMock(return_value=df_short),
            ),
        ):
            result = await run_train_for_branch(db, "tenant_1", "branch_short")

        assert result["status"] == "failed"
        assert result["error_message"] is not None
        assert result["mae"] is None

    @pytest.mark.asyncio
    async def test_run_train_for_branch_db_error(self) -> None:
        """
        data_service raise Exception (ví dụ: DB down hoặc query lỗi).
        run_train_for_branch KHÔNG re-raise — bắt lỗi, trả về status=failed.
        """
        db = _make_db()

        with patch(
            "app.services.train_service.get_branch_train_config",
            AsyncMock(side_effect=Exception("DB connection refused")),
        ):
            result = await run_train_for_branch(db, "tenant_1", "branch_err")

        assert result["status"] == "failed"
        assert "DB connection refused" in result["error_message"]
        assert result["mae"] is None

    @pytest.mark.asyncio
    async def test_run_train_for_branch_empty_consumption(self) -> None:
        """
        get_consumption_for_branch trả về DataFrame rỗng (chi nhánh chưa có đơn).
        Phải bắt ValueError và trả về status=failed.
        """
        db = _make_db()
        config = {
            "n_forecasts": 7,
            "epochs": 100,
            "weekly_seasonality": True,
            "start_date": None,
        }
        activity = {"active_days": 0}
        empty_df = pd.DataFrame(columns=["ds", "y", "ID"])

        with (
            patch(
                "app.services.train_service.get_branch_train_config",
                AsyncMock(return_value=config),
            ),
            patch(
                "app.services.train_service.get_branch_active_days",
                AsyncMock(return_value=activity),
            ),
            patch(
                "app.services.train_service.get_consumption_for_branch",
                AsyncMock(return_value=empty_df),
            ),
        ):
            result = await run_train_for_branch(db, "tenant_1", "branch_empty")

        assert result["status"] == "failed"
        assert result["error_message"] is not None


# ---------------------------------------------------------------------------
# TestManualSeedIsSet
# ---------------------------------------------------------------------------

class TestManualSeedIsSet:
    """Tests cho _build_neuralprophet_model() — kiểm tra seed cố định."""

    def test_manual_seed_is_set(self) -> None:
        """
        _build_neuralprophet_model phải gọi torch.manual_seed(42) và
        numpy.random.seed(42) TRƯỚC khi khởi tạo NeuralProphet.
        Seed cố định → weight init ổn định giữa các lần train.
        """
        config = {"n_forecasts": 7, "epochs": 100, "weekly_seasonality": True}

        with (
            patch("torch.manual_seed") as mock_torch_seed,
            patch("numpy.random.seed") as mock_np_seed,
            patch("random.seed") as mock_rand_seed,
            patch("neuralprophet.NeuralProphet") as mock_np_cls,
        ):
            # NeuralProphet mock — add_country_holidays phải tồn tại
            mock_model = MagicMock()
            mock_np_cls.return_value = mock_model

            _build_neuralprophet_model(config, n_lags=14, yearly_seasonality=False)

        mock_torch_seed.assert_called_once_with(42)
        mock_np_seed.assert_called_once_with(42)
        mock_rand_seed.assert_called_once_with(42)

    def test_country_holidays_vn_added(self) -> None:
        """
        NeuralProphet model phải được thêm ngày lễ Việt Nam (add_country_holidays("VN")).
        Bắt buộc cho dự báo chính xác tại thị trường VN.
        """
        config = {"n_forecasts": 7, "epochs": 100, "weekly_seasonality": True}

        with (
            patch("torch.manual_seed"),
            patch("numpy.random.seed"),
            patch("random.seed"),
            patch("neuralprophet.NeuralProphet") as mock_np_cls,
        ):
            mock_model = MagicMock()
            mock_np_cls.return_value = mock_model

            _build_neuralprophet_model(config, n_lags=14, yearly_seasonality=False)

        mock_model.add_country_holidays.assert_called_once_with("VN")


# ---------------------------------------------------------------------------
# TestRunTrainAllTenants
# ---------------------------------------------------------------------------

class TestRunTrainAllTenants:
    """Tests cho run_train_all_tenants() — resilience khi 1 branch thất bại."""

    @pytest.mark.asyncio
    async def test_run_train_all_tenants_one_branch_fails(self) -> None:
        """
        Tenant có 2 branches: branch_ok thành công, branch_err thất bại.
        run_train_for_branch bắt exception nội bộ → trả về status=failed.
        run_train_all_tenants không crash, kết quả chứa đủ cả 2 branches.
        """
        db = _make_db()

        # Kết quả giả lập cho 2 branches
        ok_result = {
            "branch_id": "branch_ok",
            "status": "success",
            "mae": 1.5,
            "mape": 7.2,
            "series_count": 3,
            "model_path": "storage/models/t1/branch_ok/model.np",
            "series_skipped": [],
            "error_message": None,
        }
        err_result = {
            "branch_id": "branch_err",
            "status": "failed",
            "mae": None,
            "mape": None,
            "series_count": None,
            "model_path": None,
            "series_skipped": [],
            "error_message": "DB timeout",
        }

        tenant_results = [ok_result, err_result]

        with (
            patch(
                "app.services.train_service.get_active_tenants",
                AsyncMock(return_value=["tenant_a"]),
            ),
            patch(
                "app.services.train_service.run_train_for_tenant",
                AsyncMock(return_value=tenant_results),
            ),
        ):
            results = await run_train_all_tenants(db)

        # Tổng 2 kết quả — 1 success + 1 failed
        assert len(results) == 2

        statuses = {r["branch_id"]: r["status"] for r in results}
        assert statuses["branch_ok"] == "success"
        assert statuses["branch_err"] == "failed"

        # Mỗi item phải có tenant_id được gán
        assert all(r.get("tenant_id") == "tenant_a" for r in results)

    @pytest.mark.asyncio
    async def test_run_train_all_tenants_no_tenants(self) -> None:
        """
        Không có tenant active nào → trả về list rỗng, không crash.
        """
        db = _make_db()

        with patch(
            "app.services.train_service.get_active_tenants",
            AsyncMock(return_value=[]),
        ):
            results = await run_train_all_tenants(db)

        assert results == []

    @pytest.mark.asyncio
    async def test_run_train_all_tenants_multiple_tenants(self) -> None:
        """
        2 tenants, mỗi tenant 1 branch thành công → kết quả có đủ tenant_id.
        """
        db = _make_db()

        def _make_branch_result(tenant_id: str, branch_id: str) -> dict:
            return {
                "branch_id": branch_id,
                "status": "success",
                "mae": 2.0,
                "mape": 9.0,
                "series_count": 1,
                "model_path": f"storage/models/{tenant_id}/{branch_id}/model.np",
                "series_skipped": [],
                "error_message": None,
            }

        async def mock_run_tenant(db, tenant_id, trigger_type="scheduled"):
            return [_make_branch_result(tenant_id, f"branch_{tenant_id}")]

        with (
            patch(
                "app.services.train_service.get_active_tenants",
                AsyncMock(return_value=["tenant_a", "tenant_b"]),
            ),
            patch(
                "app.services.train_service.run_train_for_tenant",
                side_effect=mock_run_tenant,
            ),
        ):
            results = await run_train_all_tenants(db)

        assert len(results) == 2
        tenant_ids = {r["tenant_id"] for r in results}
        assert tenant_ids == {"tenant_a", "tenant_b"}
