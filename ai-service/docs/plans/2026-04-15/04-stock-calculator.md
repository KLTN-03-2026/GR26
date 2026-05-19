---
plan: 04-stock-calculator
date: 2026-04-15
status: in_progress
---

# Plan: Stock Calculator

## Mục tiêu
Pure-logic utilities tính ngày hết hàng, số lượng gợi ý nhập và mức độ
khẩn cấp — không phụ thuộc DB hay ML, chỉ dùng datetime + pandas.

## Checklist

- [x] `predict_stockout_date` — tích lũy yhat1 đến khi vượt current_stock
- [x] `calc_suggested_qty`     — tổng yhat1 × safety_factor, làm tròn 2 chữ số
- [x] `calc_suggested_order_date` — stockout_date − lead_time_days (None → today+30)
- [x] `get_urgency`            — "critical" / "warning" / "ok"
- [x] Xoá import app.core.logging — file phải thuần stdlib + pandas
- [x] Unit tests edge cases tại `tests/test_stock_calculator.py`

## File ảnh hưởng
- `app/utils/stock_calculator.py` — rewrite
- `tests/test_stock_calculator.py` — tạo mới

## Thiết kế

### `predict_stockout_date`
- `current_stock <= 0` → trả về `date.today()` (đã hết hàng)
- Vòng lặp: `cumulative += max(yhat1, 0)` → khi `>= current_stock` trả ngày đó
- Nếu hết vòng mà chưa vượt → trả `None`

### `calc_suggested_qty`
- `sum(max(yhat1, 0) for each row) * safety_factor`
- `round(..., 2)`

### `calc_suggested_order_date`
- `stockout_date is None` → `date.today() + timedelta(days=30)`
- Có `stockout_date` → `stockout_date - timedelta(days=lead_time_days)`
- Không để trả ngày trong quá khứ: `max(result, date.today())`

### `get_urgency`
- `stockout_date is None` → `"ok"`
- `days_until = (stockout_date - date.today()).days`
- `<= 2` → `"critical"`, `<= 5` → `"warning"`, else → `"ok"`
- Đã hết hàng (`days_until < 0`) → `"critical"`

## Edge cases cần test
- `current_stock = 0`        → stockout hôm nay
- `current_stock = 999_999`  → None (không bao giờ hết)
- `forecast_df` rỗng         → None
- `stockout_date` là hôm nay → critical
- `lead_time_days > khoảng cách` → order date bị kéo lên today
