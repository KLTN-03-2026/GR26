---
plan: 05-predict-service
date: 2026-04-15
status: in_progress
---

# Plan: Predict Service

## Mục tiêu
Dự báo tiêu thụ 7 ngày tới cho từng nguyên liệu × chi nhánh, ghi kết quả
vào `forecast_results`, trả về `list[IngredientPrediction]`.

## Checklist

- [x] Thêm `IngredientPrediction` vào `app/schemas/forecast.py`
- [x] `_build_fallback_forecast(history_df)` — avg 7 ngày gần nhất
- [x] `_upsert_forecast_results(db, series_id_int, forecast_df, stockout, qty)` — ON CONFLICT
- [x] `predict_branch(tenant_id, branch_id, db)` — full flow
- [x] `predict_all_branches(db)` — iterate tenant → branch
- [x] Unit tests với mock model tại `tests/test_predict_service.py`

## File ảnh hưởng
- `app/schemas/forecast.py` — thêm `IngredientPrediction`
- `app/services/predict_service.py` — implement từ stub
- `tests/test_predict_service.py` — tạo mới

## Thiết kế

### Luồng predict_branch
```
1. model_io.model_exists(tenant_id)?
   - False → global_is_fallback = True
   - True  → load_model() → nếu lỗi → is_fallback = True

2. data_service.get_all_ingredients_of_branch(db, tenant_id, branch_id)
   → list[{id, name, unit}]

3. Mỗi ingredient:
   a. SeriesRegistryRepo.get_or_create(ingredient_id, branch_id)
      → series_entry (series_id_str = "s{int}", series_id_int)
   b. data_service.get_ingredient_consumption(db, tenant_id, branch_id,
      ingredient_id, days_back=np_n_lags+14)
      → history_df [ds, y]
   c. data_service.get_current_stock(db, tenant_id, branch_id, ingredient_id)
      → current_stock: float
   d. predict:
      - is_fallback: dùng _build_fallback_forecast(history_df)
      - else: build_future_df + model.predict() → lấy yhat1 từ future rows
             nếu predict exception → fallback
   e. stock_calculator: stockout_date, suggested_qty, suggested_order_date, urgency
   f. _upsert_forecast_results(db, series_id_int, forecast_df, ...)
   g. append IngredientPrediction(is_fallback=...)

4. db.commit()
5. return list[IngredientPrediction]
```

### predict_all_branches
```
get_all_active_tenants → get_all_active_branches per tenant
→ predict_branch per branch → log summary
```

### Fallback
- Dùng avg(y.tail(7)) làm yhat1 cho 7 ngày tương lai
- history rỗng → avg = 0.0
- is_fallback=True trong Pydantic response (KHÔNG lưu vào DB — không có cột này trong ORM)

### Upsert SQL
```sql
INSERT INTO forecast_results (series_id, forecast_date, predicted_qty,
                              stockout_date, suggested_qty)
VALUES (...)
ON CONFLICT (series_id, forecast_date)
DO UPDATE SET predicted_qty=EXCLUDED.predicted_qty,
             stockout_date=EXCLUDED.stockout_date,
             suggested_qty=EXCLUDED.suggested_qty
```

## Notes
- Không chạy model trong API request — predict_branch được gọi bởi scheduler
- is_fallback không có cột trong DB (ForecastResult không có field này)
  → chỉ trả về trong Pydantic schema để caller biết nguồn gốc dự báo
- data_service sử dụng tên function hiện tại:
  get_all_active_tenants, get_all_active_branches, get_all_ingredients_of_branch,
  get_ingredient_consumption, get_current_stock
