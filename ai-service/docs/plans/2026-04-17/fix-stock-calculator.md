# Fix Stock Calculator + Predict Pipeline

**Ngày:** 2026-04-17
**Tác giả:** AI Agent

---

## Mục tiêu

Sửa 3 lỗi trong chuỗi stock_calculator → predict_service:

1. **FIX 1** — Validation khi n_forecasts trong config khác với model đã train
2. **FIX 2** — Đưa `min_stock` vào tính stockout + order date
3. **FIX 3** — Tạo script xác thực suggested_order_qty bằng mắt

---

## Checklist

### FIX 1 — Model config mismatch validation
- [ ] `model_io.py`: thêm `get_model_config(tenant_id)` đọc `model_config` từ metadata
- [ ] `train_service.py`: khi `save_model()`, lưu thêm `model_config: {n_forecasts, n_lags}` vào metadata
- [ ] `predict_service.py`: thêm `_validate_model_config()` + gọi ở đầu `predict_branch()`

### FIX 2 — Dùng min_stock vào tính toán
- [ ] `stock_calculator.py`:
  - `predict_stockout_date()`: thêm param `min_stock`, đổi default `max_extrapolation_days=None`
  - `calc_suggested_order_date()`: thêm `avg_daily_consumption`, `min_stock`; bỏ hardcode `+30`
  - Thêm `calc_avg_daily_consumption()`
- [ ] `data_service.py`: thêm `min_stock` vào SELECT của `get_all_ingredients_of_branch()`
- [ ] `predict_service.py`: truyền `min_stock`, `avg_daily` vào các hàm calculator

### FIX 3 — Validation script
- [ ] `scripts/validate_suggestions.py`: script in bảng so sánh bằng mắt

### Tests
- [ ] `tests/test_stock_calculator.py`: thêm tests cho `min_stock > 0`, `stockout_date=None + avg_daily`, `calc_avg_daily_consumption`

---

## File ảnh hưởng

| File | Thay đổi |
|---|---|
| `app/utils/model_io.py` | Thêm `get_model_config()` |
| `app/utils/stock_calculator.py` | Sửa 3 hàm + thêm 1 hàm |
| `app/services/train_service.py` | Lưu `model_config` vào metadata |
| `app/services/predict_service.py` | Validation + truyền `min_stock` |
| `app/services/data_service.py` | Thêm `min_stock` vào SELECT |
| `scripts/validate_suggestions.py` | Tạo mới |
| `tests/test_stock_calculator.py` | Thêm test cases |
