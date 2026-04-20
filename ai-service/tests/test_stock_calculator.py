"""
Tests cho app/utils/stock_calculator.py

Chạy: pytest tests/test_stock_calculator.py -v
"""

from datetime import date, timedelta

import pandas as pd
import pytest

from app.utils.stock_calculator import (
    calc_avg_daily_consumption,
    calc_suggested_order_date,
    calc_suggested_qty,
    get_urgency,
    predict_stockout_date,
)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _make_forecast(daily_values: list[float], start: str = "2024-06-01") -> pd.DataFrame:
    """Tạo forecast DataFrame với cột 'ds' và 'yhat1' từ list giá trị theo ngày."""
    dates = pd.date_range(start=start, periods=len(daily_values), freq="D")
    return pd.DataFrame({"ds": dates, "yhat1": daily_values})


# ─────────────────────────────────────────────────────────────────────────────
# predict_stockout_date
# ─────────────────────────────────────────────────────────────────────────────

class TestPredictStockoutDate:
    def test_returns_today_when_stock_is_zero(self):
        """Tồn kho = 0 → đã hết hàng → trả về hôm nay."""
        forecast = _make_forecast([5.0, 5.0, 5.0])
        result = predict_stockout_date(0.0, forecast)
        assert result == date.today()

    def test_returns_today_when_stock_is_negative(self):
        """Tồn kho âm → coi như đã hết → trả về hôm nay."""
        forecast = _make_forecast([5.0, 5.0])
        result = predict_stockout_date(-10.0, forecast)
        assert result == date.today()

    def test_returns_none_when_stock_never_runs_out_with_limit(self):
        """Tồn kho quá lớn + max_extrapolation_days đặt giới hạn → trả về None."""
        forecast = _make_forecast([5.0] * 7)  # tổng = 35
        # 999_999 / 5 = 199_999 ngày sau window → vượt limit 30 → None
        result = predict_stockout_date(999_999.0, forecast, max_extrapolation_days=30)
        assert result is None

    def test_extrapolates_near_stockout_after_forecast_window(self):
        """Tồn kho đủ qua 7 ngày nhưng sắp hết sau window → extrapolate."""
        forecast = _make_forecast([
            72.52542114257812,
            85.3180160522461,
            69.81234741210938,
            113.71172332763672,
            110.37989044189453,
            110.96672058105469,
            110.07401275634766,
        ], start="2026-04-17")
        result = predict_stockout_date(1061.4, forecast)
        assert result == date(2026, 4, 28)

    def test_returns_none_for_empty_forecast(self):
        """Forecast rỗng → không thể tính → None."""
        result = predict_stockout_date(100.0, pd.DataFrame(columns=["ds", "yhat1"]))
        assert result is None

    def test_stockout_on_exact_day(self):
        """Tồn kho vừa bằng tổng tích lũy tới ngày N → trả về ngày N."""
        # stock=10, ngày 1: +4, ngày 2: +4, ngày 3: +2 → tích lũy = 10 vào ngày 3
        forecast = _make_forecast([4.0, 4.0, 2.0], start="2024-06-01")
        result = predict_stockout_date(10.0, forecast)
        assert result == date(2024, 6, 3)

    def test_stockout_on_first_day(self):
        """Ngày đầu tiên tiêu thụ đã vượt stock → trả về ngày đầu."""
        forecast = _make_forecast([100.0, 50.0, 50.0], start="2024-06-01")
        result = predict_stockout_date(10.0, forecast)
        assert result == date(2024, 6, 1)

    def test_negative_yhat1_clipped_to_zero(self):
        """yhat1 âm phải được clip về 0 — không được trừ vào tích lũy."""
        # Ngày 1: -5 (clip 0), ngày 2: -5 (clip 0), ngày 3: 10
        # Tích lũy thực tế = 10 vào ngày 3
        forecast = _make_forecast([-5.0, -5.0, 10.0], start="2024-06-01")
        result = predict_stockout_date(5.0, forecast)
        # Vì yhat1 âm = 0, cumulative = 0 + 0 + 10 = 10 >= 5 → ngày 3
        assert result == date(2024, 6, 3)

    def test_stock_exactly_zero_returns_today_not_forecast(self):
        """current_stock = 0 trả về hôm nay bất kể forecast."""
        forecast = _make_forecast([0.0, 0.0, 0.0])
        result = predict_stockout_date(0.0, forecast)
        assert result == date.today()

    def test_all_zero_forecast_returns_none(self):
        """Toàn bộ yhat1 = 0 → tiêu thụ 0 → không bao giờ hết."""
        forecast = _make_forecast([0.0] * 7)
        result = predict_stockout_date(5.0, forecast)
        assert result is None

    def test_stockout_mid_week(self):
        """Kiểm tra chính xác ngày tích lũy vượt ngưỡng."""
        # stock=25, tiêu thụ: 5 5 5 5 5 5 5 → vượt vào ngày 5 (tích lũy = 25)
        forecast = _make_forecast([5.0] * 7, start="2024-06-01")
        result = predict_stockout_date(25.0, forecast)
        assert result == date(2024, 6, 5)

    def test_min_stock_reduces_usable_stock(self):
        """min_stock > 0 → chỉ dùng được (current - min) trước khi phải order."""
        # current=10, min=2 → usable=8
        # tiêu thụ 2/ngày → hết sau 4 ngày (ngày 2024-06-04)
        forecast = _make_forecast([2.0] * 7, start="2024-06-01")
        result = predict_stockout_date(10.0, forecast, min_stock=2.0)
        assert result == date(2024, 6, 4)

    def test_min_stock_equals_current_stock_returns_today(self):
        """current_stock = min_stock → usable = 0 → đã ở mức an toàn tối thiểu → trả today."""
        forecast = _make_forecast([5.0] * 7)
        result = predict_stockout_date(5.0, forecast, min_stock=5.0)
        assert result == date.today()

    def test_min_stock_exceeds_current_stock_returns_today(self):
        """current_stock < min_stock → đã dưới mức an toàn → trả today."""
        forecast = _make_forecast([5.0] * 7)
        result = predict_stockout_date(3.0, forecast, min_stock=5.0)
        assert result == date.today()

    def test_min_stock_zero_behaves_like_no_min_stock(self):
        """min_stock=0 giữ nguyên behavior cũ."""
        forecast = _make_forecast([5.0] * 7, start="2024-06-01")
        result_no_min = predict_stockout_date(25.0, forecast, min_stock=0.0)
        result_old = predict_stockout_date(25.0, forecast)
        assert result_no_min == result_old

    def test_stock_exceeds_forecast_window_returns_none_by_default(self):
        """Tồn kho vượt forecast window, max_extrapolation_days=None → không giới hạn."""
        # usable = 100, tiêu thụ 5/ngày × 7 = 35 trong window → còn 65 sau window
        # avg = 5/ngày → cần 13 ngày thêm → extrapolate và trả về ngày cụ thể
        forecast = _make_forecast([5.0] * 7, start="2024-06-01")
        result = predict_stockout_date(100.0, forecast, max_extrapolation_days=None)
        # 100/5 = 20 ngày → ngày 2024-06-20
        assert result == date(2024, 6, 20)


# ─────────────────────────────────────────────────────────────────────────────
# calc_suggested_qty
# ─────────────────────────────────────────────────────────────────────────────

class TestCalcSuggestedQty:
    def test_basic_calculation_with_default_safety(self):
        """Tổng 7 × 1.2 safety factor."""
        forecast = _make_forecast([10.0] * 7)
        result = calc_suggested_qty(forecast)
        assert result == round(70.0 * 1.2, 2)  # = 84.0

    def test_custom_safety_factor(self):
        forecast = _make_forecast([10.0] * 7)
        result = calc_suggested_qty(forecast, safety_factor=1.5)
        assert result == round(70.0 * 1.5, 2)  # = 105.0

    def test_empty_forecast_returns_zero(self):
        result = calc_suggested_qty(pd.DataFrame(columns=["ds", "yhat1"]))
        assert result == 0.0

    def test_negative_yhat1_clipped_to_zero(self):
        """Giá trị âm không được tính vào tổng."""
        forecast = _make_forecast([-10.0, -5.0, 20.0])
        result = calc_suggested_qty(forecast, safety_factor=1.0)
        assert result == 20.0  # chỉ tính ngày thứ 3

    def test_rounded_to_two_decimal_places(self):
        """Kết quả làm tròn 2 chữ số thập phân."""
        forecast = _make_forecast([1.0, 1.0, 1.0])  # tổng = 3.0
        result = calc_suggested_qty(forecast, safety_factor=1.3)
        assert result == round(3.0 * 1.3, 2)  # = 3.9

    def test_safety_factor_one_means_no_buffer(self):
        """safety_factor=1.0 → không thêm buffer."""
        forecast = _make_forecast([5.0] * 4)
        result = calc_suggested_qty(forecast, safety_factor=1.0)
        assert result == 20.0

    def test_mixed_positive_and_negative(self):
        forecast = _make_forecast([10.0, -3.0, 5.0, -1.0, 8.0])
        # Chỉ tính: 10 + 0 + 5 + 0 + 8 = 23
        result = calc_suggested_qty(forecast, safety_factor=1.0)
        assert result == 23.0

    def test_all_zeros(self):
        forecast = _make_forecast([0.0] * 7)
        result = calc_suggested_qty(forecast)
        assert result == 0.0

    def test_subtracts_current_stock_when_provided(self):
        forecast = _make_forecast([10.0] * 7)
        result = calc_suggested_qty(forecast, current_stock=50.0)
        assert result == round(70.0 * 1.2 - 50.0, 2)

    def test_returns_zero_when_current_stock_covers_forecast_with_buffer(self):
        forecast = _make_forecast([10.0] * 7)
        result = calc_suggested_qty(forecast, current_stock=100.0)
        assert result == 0.0


# ─────────────────────────────────────────────────────────────────────────────
# calc_suggested_order_date
# ─────────────────────────────────────────────────────────────────────────────

class TestCalcSuggestedOrderDate:
    def test_none_stockout_returns_today_plus_30(self):
        """Không có ngày hết hàng → đặt hàng sau 30 ngày."""
        result = calc_suggested_order_date(None)
        assert result == date.today() + timedelta(days=30)

    def test_stockout_minus_lead_time(self):
        """stockout_date - lead_time_days."""
        stockout = date.today() + timedelta(days=10)
        result = calc_suggested_order_date(stockout, lead_time_days=2)
        assert result == date.today() + timedelta(days=8)

    def test_result_not_in_past(self):
        """Nếu stockout_date - lead_time quá nhỏ → trả về today."""
        stockout = date.today() + timedelta(days=1)
        result = calc_suggested_order_date(stockout, lead_time_days=5)
        assert result == date.today()

    def test_stockout_today_with_lead_time(self):
        """Hết hàng hôm nay: stockout - lead_time < today → trả today."""
        result = calc_suggested_order_date(date.today(), lead_time_days=2)
        assert result == date.today()

    def test_stockout_past_with_lead_time(self):
        """Hết hàng hôm qua (quá hạn) → đặt hàng ngay hôm nay."""
        stockout = date.today() - timedelta(days=3)
        result = calc_suggested_order_date(stockout, lead_time_days=2)
        assert result == date.today()

    def test_lead_time_zero(self):
        """lead_time = 0 → đặt hàng đúng ngày hết hàng."""
        stockout = date.today() + timedelta(days=7)
        result = calc_suggested_order_date(stockout, lead_time_days=0)
        assert result == stockout

    def test_large_lead_time_exceeds_stockout(self):
        """Lead time lớn hơn khoảng cách → trả về today."""
        stockout = date.today() + timedelta(days=3)
        result = calc_suggested_order_date(stockout, lead_time_days=10)
        assert result == date.today()

    def test_custom_none_horizon(self):
        """None → today + DEFAULT_ORDER_HORIZON_DAYS (=30)."""
        result = calc_suggested_order_date(None, lead_time_days=2)
        assert result == date.today() + timedelta(days=30)

    def test_none_stockout_with_avg_daily_estimates_order_date(self):
        """stockout_date=None nhưng có avg_daily → ước tính từ usable_stock."""
        # current=100, min=10 → usable=90, avg=5/ngày → hết sau 18 ngày
        # order_date = today + 18 - 2 (lead) = today + 16
        result = calc_suggested_order_date(
            None,
            lead_time_days=2,
            avg_daily_consumption=5.0,
            min_stock=10.0,
            current_stock=100.0,
        )
        assert result == date.today() + timedelta(days=16)

    def test_none_stockout_avg_daily_result_not_in_past(self):
        """Kết quả ước tính không được là ngày quá khứ."""
        # current=1, min=0 → usable=1, avg=10/ngày → hết 0.1 ngày → order ngay
        result = calc_suggested_order_date(
            None,
            lead_time_days=2,
            avg_daily_consumption=10.0,
            min_stock=0.0,
            current_stock=1.0,
        )
        assert result == date.today()

    def test_none_stockout_no_avg_daily_falls_back_to_horizon(self):
        """avg_daily=0 → không ước tính được → fallback today + 30."""
        result = calc_suggested_order_date(
            None,
            lead_time_days=2,
            avg_daily_consumption=0.0,
        )
        assert result == date.today() + timedelta(days=30)


# ─────────────────────────────────────────────────────────────────────────────
# calc_avg_daily_consumption
# ─────────────────────────────────────────────────────────────────────────────

class TestCalcAvgDailyConsumption:
    def test_basic_average(self):
        """Trung bình đơn giản của các giá trị dương."""
        forecast = _make_forecast([4.0, 6.0, 8.0, 2.0])
        result = calc_avg_daily_consumption(forecast)
        assert result == 5.0  # (4+6+8+2)/4

    def test_empty_forecast_returns_zero(self):
        """Forecast rỗng → 0.0."""
        result = calc_avg_daily_consumption(pd.DataFrame(columns=["ds", "yhat1"]))
        assert result == 0.0

    def test_negative_values_clipped_to_zero(self):
        """Giá trị âm được clip về 0 trước khi tính trung bình."""
        forecast = _make_forecast([-5.0, -3.0, 10.0])
        result = calc_avg_daily_consumption(forecast)
        assert result == pytest.approx((0.0 + 0.0 + 10.0) / 3)

    def test_all_zeros(self):
        """Toàn bộ = 0 → trả về 0.0."""
        forecast = _make_forecast([0.0] * 7)
        result = calc_avg_daily_consumption(forecast)
        assert result == 0.0

    def test_nan_values_skipped(self):
        """NaN được bỏ qua, chỉ tính các giá trị hợp lệ."""
        import numpy as np
        forecast = _make_forecast([10.0, float("nan"), 6.0])
        result = calc_avg_daily_consumption(forecast)
        # NaN bị skip, tính trung bình: (10 + 0_from_nan_skip + 6) / ...
        # Thực tế: pd.notna lọc NaN, chỉ còn [10.0, 6.0] → avg = 8.0
        assert result == pytest.approx(8.0)


# ─────────────────────────────────────────────────────────────────────────────
# get_urgency
# ─────────────────────────────────────────────────────────────────────────────

class TestGetUrgency:
    def test_none_returns_ok(self):
        """Không có ngày hết hàng → ok."""
        assert get_urgency(None) == "ok"

    def test_stockout_today_is_critical(self):
        """Hết hàng hôm nay → critical (0 ngày còn lại)."""
        assert get_urgency(date.today()) == "critical"

    def test_stockout_tomorrow_is_critical(self):
        """Hết hàng ngày mai → critical (1 ngày còn lại)."""
        assert get_urgency(date.today() + timedelta(days=1)) == "critical"

    def test_stockout_in_two_days_is_critical(self):
        """Hết hàng sau đúng 2 ngày → critical (ngưỡng <=2)."""
        assert get_urgency(date.today() + timedelta(days=2)) == "critical"

    def test_stockout_in_three_days_is_warning(self):
        """Hết hàng sau 3 ngày → warning."""
        assert get_urgency(date.today() + timedelta(days=3)) == "warning"

    def test_stockout_in_five_days_is_warning(self):
        """Hết hàng sau đúng 5 ngày → warning (ngưỡng <=5)."""
        assert get_urgency(date.today() + timedelta(days=5)) == "warning"

    def test_stockout_in_six_days_is_ok(self):
        """Hết hàng sau 6 ngày → ok."""
        assert get_urgency(date.today() + timedelta(days=6)) == "ok"

    def test_stockout_in_far_future_is_ok(self):
        """Hết hàng sau 30 ngày → ok."""
        assert get_urgency(date.today() + timedelta(days=30)) == "ok"

    def test_stockout_yesterday_is_critical(self):
        """Đã hết hàng hôm qua (days_until = -1) → critical."""
        assert get_urgency(date.today() - timedelta(days=1)) == "critical"

    def test_stockout_long_ago_is_critical(self):
        """Đã hết hàng 10 ngày trước → critical."""
        assert get_urgency(date.today() - timedelta(days=10)) == "critical"

    def test_return_values_are_string_literals(self):
        """Giá trị trả về phải đúng là 'critical', 'warning', 'ok'."""
        assert get_urgency(date.today()) in {"critical", "warning", "ok"}
        assert get_urgency(date.today() + timedelta(days=4)) in {"critical", "warning", "ok"}
        assert get_urgency(None) in {"critical", "warning", "ok"}
