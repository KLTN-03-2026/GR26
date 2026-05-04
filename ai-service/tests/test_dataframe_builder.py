"""
Tests cho app/utils/dataframe_builder.py

Chạy: pytest tests/test_dataframe_builder.py -v
"""

import pandas as pd
import pytest

from app.utils.dataframe_builder import (
    aggregate_to_weekly,
    build_future_df,
    build_global_df,
    build_series_id,
    classify_demand_pattern,
    split_by_demand_pattern,
    split_by_series,
    validate_series,
)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _make_df(
    series_id: str,
    n_days: int,
    start: str = "2024-01-01",
    y_value: float = 5.0,
) -> pd.DataFrame:
    """Tạo DataFrame với n_days hàng liên tục, dùng trong test."""
    dates = pd.date_range(start=start, periods=n_days, freq="D")
    return pd.DataFrame({
        "ds": dates,
        "y": [y_value] * n_days,
        "ID": [series_id] * n_days,
    })


# ─────────────────────────────────────────────────────────────────────────────
# build_global_df
# ─────────────────────────────────────────────────────────────────────────────

class TestBuildGlobalDf:
    def test_fills_missing_dates_with_zero(self):
        """Ngày trống giữa Jan 1 và Jan 5 phải được điền y=0."""
        df = pd.DataFrame({
            "ds": pd.to_datetime(["2024-01-01", "2024-01-03", "2024-01-05"]),
            "y": [10.0, 20.0, 30.0],
            "ID": ["s1", "s1", "s1"],
        })
        result = build_global_df(df)
        assert len(result) == 5  # Jan 1–5
        assert result.loc[result["ds"] == pd.Timestamp("2024-01-02"), "y"].iloc[0] == 0.0
        assert result.loc[result["ds"] == pd.Timestamp("2024-01-04"), "y"].iloc[0] == 0.0

    def test_clips_negative_y_to_zero(self):
        """Giá trị y âm phải được clip về 0."""
        df = pd.DataFrame({
            "ds": pd.to_datetime(["2024-01-01", "2024-01-02"]),
            "y": [-5.0, 10.0],
            "ID": ["s1", "s1"],
        })
        result = build_global_df(df)
        assert (result["y"] >= 0).all()
        assert result.loc[result["ds"] == pd.Timestamp("2024-01-01"), "y"].iloc[0] == 0.0

    def test_multiple_series_each_filled_independently(self):
        """Mỗi series chỉ fill trong phạm vi min/max ngày của nó."""
        df = pd.concat([
            pd.DataFrame({
                "ds": pd.to_datetime(["2024-01-01", "2024-01-03"]),
                "y": [5.0, 15.0],
                "ID": ["s1", "s1"],
            }),
            pd.DataFrame({
                "ds": pd.to_datetime(["2024-02-01", "2024-02-02"]),
                "y": [8.0, 12.0],
                "ID": ["s2", "s2"],
            }),
        ], ignore_index=True)
        result = build_global_df(df)
        # s1: Jan 1–3 = 3 rows (Jan 2 filled)
        assert len(result[result["ID"] == "s1"]) == 3
        # s2: Feb 1–2 = 2 rows (không cần fill)
        assert len(result[result["ID"] == "s2"]) == 2

    def test_no_data_loss_for_existing_dates(self):
        """Ngày đã có data không bị thay đổi giá trị y."""
        df = _make_df("s1", 5, y_value=7.0)
        result = build_global_df(df)
        assert (result["y"] == 7.0).all()
        assert len(result) == 5

    def test_raises_on_missing_id_column(self):
        """Thiếu cột ID → ValueError."""
        df = pd.DataFrame({
            "ds": pd.to_datetime(["2024-01-01"]),
            "y": [1.0],
        })
        with pytest.raises(ValueError, match="Thiếu cột bắt buộc"):
            build_global_df(df)

    def test_raises_on_missing_y_column(self):
        """Thiếu cột y → ValueError."""
        df = pd.DataFrame({
            "ds": pd.to_datetime(["2024-01-01"]),
            "ID": ["s1"],
        })
        with pytest.raises(ValueError, match="Thiếu cột bắt buộc"):
            build_global_df(df)

    def test_raises_on_non_datetime_ds(self):
        """ds là string chưa convert → ValueError."""
        df = pd.DataFrame({
            "ds": ["2024-01-01", "2024-01-02"],  # string, không phải datetime
            "y": [1.0, 2.0],
            "ID": ["s1", "s1"],
        })
        with pytest.raises(ValueError, match="datetime64"):
            build_global_df(df)

    def test_empty_df_returns_empty(self):
        """DataFrame rỗng (0 rows) → trả về DataFrame rỗng."""
        df = pd.DataFrame({"ds": pd.Series(dtype="datetime64[ns]"), "y": [], "ID": []})
        result = build_global_df(df)
        assert result.empty
        assert set(result.columns) >= {"ds", "y", "ID"}

    def test_single_day_series_no_fill_needed(self):
        """Series chỉ có 1 ngày → không có ngày nào để fill."""
        df = pd.DataFrame({
            "ds": pd.to_datetime(["2024-01-01"]),
            "y": [3.0],
            "ID": ["s1"],
        })
        result = build_global_df(df)
        assert len(result) == 1
        assert result["y"].iloc[0] == 3.0

    def test_output_sorted_by_id_then_ds(self):
        """Output phải sort theo (ID, ds)."""
        df = pd.concat([
            _make_df("s2", 3, start="2024-01-01"),
            _make_df("s1", 3, start="2024-01-01"),
        ], ignore_index=True)
        result = build_global_df(df)
        ids = result["ID"].tolist()
        # s1 phải đứng trước s2 (sort theo ID)
        first_s2 = next(i for i, v in enumerate(ids) if v == "s2")
        last_s1 = max(i for i, v in enumerate(ids) if v == "s1")
        assert last_s1 < first_s2


# ─────────────────────────────────────────────────────────────────────────────
# validate_series
# ─────────────────────────────────────────────────────────────────────────────

class TestValidateSeries:
    def test_sufficient_series_returns_true(self):
        df = _make_df("s1", 30)
        result = validate_series(df, min_days=30)
        assert result == {"s1": True}

    def test_insufficient_series_returns_false(self):
        df = _make_df("s1", 15)
        result = validate_series(df, min_days=30)
        assert result == {"s1": False}

    def test_exactly_min_days_is_valid(self):
        """Đúng bằng ngưỡng → True (>=)."""
        df = _make_df("s1", 30)
        result = validate_series(df, min_days=30)
        assert result["s1"] is True

    def test_one_below_min_is_invalid(self):
        """Kém 1 ngày → False."""
        df = _make_df("s1", 29)
        result = validate_series(df, min_days=30)
        assert result["s1"] is False

    def test_multiple_series_mixed_result(self):
        df_ok = _make_df("s1", 35)
        df_short = _make_df("s2", 10, start="2024-02-01")
        df = pd.concat([df_ok, df_short], ignore_index=True)
        result = validate_series(df, min_days=30)
        assert result["s1"] is True
        assert result["s2"] is False

    def test_custom_min_days(self):
        """min_days nhỏ → dễ pass hơn."""
        df = _make_df("s1", 5)
        result = validate_series(df, min_days=3)
        assert result["s1"] is True

    def test_duplicate_dates_count_as_one_day(self):
        """Cùng ngày nhưng nhiều rows → chỉ tính là 1 ngày unique."""
        dates = pd.to_datetime(["2024-01-01"] * 10)
        df = pd.DataFrame({"ds": dates, "y": [1.0] * 10, "ID": ["s1"] * 10})
        result = validate_series(df, min_days=5)
        assert result["s1"] is False  # chỉ có 1 ngày unique

    def test_raises_on_missing_id_column(self):
        df = pd.DataFrame({"ds": pd.to_datetime(["2024-01-01"]), "y": [1.0]})
        with pytest.raises(ValueError):
            validate_series(df)

    def test_raises_on_missing_ds_column(self):
        df = pd.DataFrame({"y": [1.0], "ID": ["s1"]})
        with pytest.raises(ValueError):
            validate_series(df)

    def test_empty_df_returns_empty_dict(self):
        df = pd.DataFrame({"ds": pd.Series(dtype="datetime64[ns]"), "y": [], "ID": []})
        result = validate_series(df)
        assert result == {}


# ─────────────────────────────────────────────────────────────────────────────
# build_future_df
# ─────────────────────────────────────────────────────────────────────────────

class TestBuildFutureDf:
    def _make_history(self, n_days: int = 14, series_id: str = "s1") -> pd.DataFrame:
        return _make_df(series_id, n_days, y_value=3.0)

    def test_output_length_equals_history_plus_periods(self):
        history = self._make_history(14)
        result = build_future_df(history, "s1", periods=7)
        assert len(result) == 14 + 7

    def test_future_rows_have_nan_y(self):
        """7 hàng tương lai phải có y=NaN."""
        history = self._make_history(14)
        result = build_future_df(history, "s1", periods=7)
        future_part = result[result["y"].isna()]
        assert len(future_part) == 7

    def test_history_rows_preserve_y_values(self):
        """Phần lịch sử không được thay đổi y."""
        history = self._make_history(14, "s1")
        result = build_future_df(history, "s1", periods=7)
        history_part = result.dropna(subset=["y"])
        assert (history_part["y"] == 3.0).all()

    def test_future_starts_one_day_after_last_history(self):
        history = self._make_history(14)
        last_history_date = history["ds"].max()
        result = build_future_df(history, "s1", periods=7)
        first_future = result[result["y"].isna()]["ds"].min()
        assert first_future == last_history_date + pd.Timedelta(days=1)

    def test_future_dates_consecutive_daily(self):
        """Các ngày tương lai phải liên tục (cách nhau 1 ngày)."""
        history = self._make_history(14)
        result = build_future_df(history, "s1", periods=7)
        future_dates = result[result["y"].isna()]["ds"].sort_values()
        diffs = future_dates.diff().dropna()
        assert (diffs == pd.Timedelta("1D")).all()

    def test_id_column_set_for_all_rows(self):
        """Toàn bộ rows (history + future) phải có ID đúng."""
        history = self._make_history(14)
        result = build_future_df(history, "s42", periods=7)
        assert (result["ID"] == "s42").all()

    def test_output_sorted_by_ds(self):
        history = self._make_history(14)
        result = build_future_df(history, "s1", periods=7)
        assert result["ds"].is_monotonic_increasing

    def test_custom_periods(self):
        history = self._make_history(14)
        result = build_future_df(history, "s1", periods=14)
        future_part = result[result["y"].isna()]
        assert len(future_part) == 14

    def test_raises_on_empty_history(self):
        """history_df rỗng → ValueError."""
        empty = pd.DataFrame(columns=["ds", "y"])
        with pytest.raises(ValueError, match="rỗng"):
            build_future_df(empty, "s1")

    def test_history_without_id_column_still_works(self):
        """history_df không cần có sẵn cột ID — build_future_df tự thêm."""
        history = pd.DataFrame({
            "ds": pd.date_range("2024-01-01", periods=10, freq="D"),
            "y": [1.0] * 10,
        })
        result = build_future_df(history, "s99", periods=3)
        assert (result["ID"] == "s99").all()
        assert len(result) == 13


# ─────────────────────────────────────────────────────────────────────────────
# split_by_series
# ─────────────────────────────────────────────────────────────────────────────

class TestSplitBySeries:
    def test_splits_into_correct_keys(self):
        df = pd.concat([_make_df("s1", 5), _make_df("s2", 3)], ignore_index=True)
        result = split_by_series(df)
        assert set(result.keys()) == {"s1", "s2"}

    def test_each_group_has_correct_length(self):
        df = pd.concat([_make_df("s1", 5), _make_df("s2", 3)], ignore_index=True)
        result = split_by_series(df)
        assert len(result["s1"]) == 5
        assert len(result["s2"]) == 3

    def test_index_is_reset(self):
        """Mỗi sub-DataFrame phải có index bắt đầu từ 0."""
        df = pd.concat([_make_df("s1", 5), _make_df("s2", 3)], ignore_index=True)
        result = split_by_series(df)
        assert list(result["s1"].index) == list(range(5))
        assert list(result["s2"].index) == list(range(3))

    def test_single_series(self):
        df = _make_df("s1", 7)
        result = split_by_series(df)
        assert len(result) == 1
        assert "s1" in result
        assert len(result["s1"]) == 7

    def test_raises_on_missing_id_column(self):
        df = pd.DataFrame({"ds": pd.to_datetime(["2024-01-01"]), "y": [1.0]})
        with pytest.raises(ValueError, match="cột 'ID'"):
            split_by_series(df)

    def test_three_series(self):
        df = pd.concat([
            _make_df("s1", 3),
            _make_df("s2", 4),
            _make_df("s3", 5),
        ], ignore_index=True)
        result = split_by_series(df)
        assert len(result) == 3
        assert len(result["s3"]) == 5


# ─────────────────────────────────────────────────────────────────────────────
# classify_demand_pattern
# ─────────────────────────────────────────────────────────────────────────────

class TestClassifyDemandPattern:
    def _make_series(self, n_days: int, nonzero_days: int) -> pd.DataFrame:
        """Tạo series với nonzero_days ngày y>0 và phần còn lại y=0."""
        y = [5.0] * nonzero_days + [0.0] * (n_days - nonzero_days)
        return pd.DataFrame({
            "ds": pd.date_range("2024-01-01", periods=n_days, freq="D"),
            "y": y,
            "ID": ["s1"] * n_days,
        })

    def test_classify_regular_high_nonzero(self):
        """90% ngày > 0 → "regular"."""
        df = self._make_series(100, 90)
        assert classify_demand_pattern(df) == "regular"

    def test_classify_regular_boundary(self):
        """Đúng 70% → "regular" (≥ 0.70)."""
        df = self._make_series(100, 70)
        assert classify_demand_pattern(df) == "regular"

    def test_classify_intermittent(self):
        """50% ngày > 0 → "intermittent"."""
        df = self._make_series(100, 50)
        assert classify_demand_pattern(df) == "intermittent"

    def test_classify_intermittent_lower_boundary(self):
        """Đúng 25% → "intermittent" (≥ 0.25)."""
        df = self._make_series(100, 25)
        assert classify_demand_pattern(df) == "intermittent"

    def test_classify_sparse_low_nonzero(self):
        """15% ngày > 0 → "sparse"."""
        df = self._make_series(100, 15)
        assert classify_demand_pattern(df) == "sparse"

    def test_classify_sparse_all_zero(self):
        """Toàn bộ y=0 → "sparse"."""
        df = self._make_series(60, 0)
        assert classify_demand_pattern(df) == "sparse"

    def test_classify_empty_returns_sparse(self):
        """DataFrame rỗng → "sparse" (safe default)."""
        assert classify_demand_pattern(pd.DataFrame(columns=["y"])) == "sparse"


# ─────────────────────────────────────────────────────────────────────────────
# aggregate_to_weekly
# ─────────────────────────────────────────────────────────────────────────────

class TestAggregateToWeekly:
    def _make_daily_df(
        self,
        series_id: str = "s1",
        n_days: int = 21,
        y_value: float = 10.0,
        start: str = "2024-01-01",
    ) -> pd.DataFrame:
        dates = pd.date_range(start=start, periods=n_days, freq="D")
        return pd.DataFrame({
            "ds": dates,
            "y": [y_value] * n_days,
            "ID": series_id,
        })

    def test_weekly_sum_correct(self):
        """21 ngày × y=10 → 3 tuần × y=70 (mỗi tuần tổng 7×10=70)."""
        df = self._make_daily_df(n_days=21, y_value=10.0, start="2024-01-01")
        result = aggregate_to_weekly(df)
        # Tổng y không thay đổi (chỉ gộp)
        assert abs(result["y"].sum() - df["y"].sum()) < 1.0

    def test_output_has_correct_columns(self):
        df = self._make_daily_df(n_days=14)
        result = aggregate_to_weekly(df)
        assert set(result.columns) >= {"ds", "y", "ID"}

    def test_fewer_rows_than_input(self):
        """21 ngày → ít hơn 21 rows (được gộp thành tuần)."""
        df = self._make_daily_df(n_days=21)
        result = aggregate_to_weekly(df)
        assert len(result) < len(df)

    def test_no_missing_weeks(self):
        """Khoảng trống giữa 2 tuần bị fill y=0."""
        # Tạo df với gap: 7 ngày đầu + bỏ 1 tuần + 7 ngày cuối
        dates1 = pd.date_range("2024-01-01", periods=7, freq="D")
        dates2 = pd.date_range("2024-01-22", periods=7, freq="D")
        df = pd.DataFrame({
            "ds": list(dates1) + list(dates2),
            "y": [10.0] * 14,
            "ID": "s1",
        })
        result = aggregate_to_weekly(df)
        # Tuần giữa phải có y=0
        assert any(result["y"] == 0.0), "Tuần thiếu phải được fill y=0"
        # Không có NaN trong y
        assert not result["y"].isna().any()

    def test_empty_df_returns_empty(self):
        df = pd.DataFrame(columns=["ds", "y", "ID"])
        result = aggregate_to_weekly(df)
        assert result.empty

    def test_multi_series_aggregated_independently(self):
        """2 series khác nhau → mỗi series có weekly riêng."""
        df = pd.concat([
            self._make_daily_df("s1", n_days=14, y_value=5.0),
            self._make_daily_df("s2", n_days=14, y_value=3.0, start="2024-02-01"),
        ], ignore_index=True)
        result = aggregate_to_weekly(df)
        assert set(result["ID"].unique()) == {"s1", "s2"}
        # s1 và s2 không lẫn lộn
        assert (result[result["ID"] == "s1"]["y"] > 0).any()
        assert (result[result["ID"] == "s2"]["y"] > 0).any()

    def test_raises_on_missing_columns(self):
        df = pd.DataFrame({"ds": pd.to_datetime(["2024-01-01"]), "y": [1.0]})
        with pytest.raises(ValueError):
            aggregate_to_weekly(df)


# ─────────────────────────────────────────────────────────────────────────────
# build_series_id
# ─────────────────────────────────────────────────────────────────────────────

class TestBuildSeriesId:
    def test_format(self):
        assert build_series_id("t1", "ing1", "br1") == "t1__ing1__br1"

    def test_uuid_format(self):
        result = build_series_id(
            "tenant-uuid-123",
            "ingredient-uuid-456",
            "branch-uuid-789",
        )
        assert result == "tenant-uuid-123__ingredient-uuid-456__branch-uuid-789"

    def test_components_separated_by_double_underscore(self):
        result = build_series_id("a", "b", "c")
        parts = result.split("__")
        assert parts == ["a", "b", "c"]
