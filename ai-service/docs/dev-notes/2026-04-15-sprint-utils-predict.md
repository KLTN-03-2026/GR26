# Sprint Notes — Utils & Predict Service
> Ngày: 2026-04-15 | Tác giả: Claude (AI Agent) | Session: implement 3 files

---

## Tổng quan

Phiên này implement 3 file còn thiếu trong pipeline dự báo tồn kho:

| # | File | Loại | Trạng thái |
|---|------|------|-----------|
| 1 | `app/utils/dataframe_builder.py` | Utility | ✅ Hoàn thành |
| 2 | `app/utils/stock_calculator.py` | Utility | ✅ Hoàn thành |
| 3 | `app/services/predict_service.py` | Service | ✅ Hoàn thành |

**Tổng tests:** 97/97 pass (39 + 37 + 21)

---

## FILE 1 — `app/utils/dataframe_builder.py`

**Plan:** `docs/plans/2026-04-15/03-dataframe-builder.md`
**Tests:** `tests/test_dataframe_builder.py` — 39 tests

### Mục đích
Chuẩn bị và làm sạch DataFrame đúng format NeuralProphet trước khi train/predict.
Tách biệt khỏi service layer để dễ test độc lập.

### Functions

| Function | Signature | Hành vi |
|----------|-----------|---------|
| `build_series_id` | `(tenant_id, ingredient_id, branch_id) → str` | Format: `"{tenant}__{ingredient}__{branch}"` |
| `build_global_df` | `(raw_df) → pd.DataFrame` | Validate cột + dtype, clip y âm về 0, điền ngày trống với y=0 |
| `validate_series` | `(df, min_days=30) → dict[str, bool]` | Đếm unique days mỗi series, True nếu đủ ngưỡng |
| `build_future_df` | `(history_df, series_id, periods=7) → pd.DataFrame` | Ghép lịch sử + future rows (y=NaN) cho model.predict() |
| `split_by_series` | `(df) → dict[str, pd.DataFrame]` | Tách DataFrame lớn thành dict theo cột ID |

### Chi tiết `build_global_df`

```
Input raw_df [ds, y, ID]
       ↓
1. Validate cột {ds, y, ID} đủ không?  → ValueError nếu thiếu
2. Validate ds là datetime64?           → ValueError nếu sai type
3. Clip y < 0 → 0 (log warning)
4. Với mỗi series (groupby ID):
   - min_date → max_date = full date range
   - left merge → fill NaN = 0
5. Concat + sort (ID, ds)
       ↓
Output: DataFrame sạch cho model.fit()
```

### Chi tiết `build_future_df`

```
history_df [ds, y]  +  series_id  +  periods=7
       ↓
last_date = max(history_df["ds"])
future_dates = [last_date+1 .. last_date+7]
       ↓
history rows:  ds=actual, y=actual, ID=series_id
future rows:   ds=future, y=NaN,    ID=series_id
       ↓
concat + sort ds → NeuralProphet predict input
```

### Validate rules

| Điều kiện | Xử lý |
|-----------|-------|
| Thiếu cột `ds`, `y`, hoặc `ID` | `ValueError` |
| `ds` không phải `datetime64` | `ValueError` — gợi ý dùng `pd.to_datetime()` |
| `y < 0` | Clip về 0, log warning |
| Ngày trống (không có giao dịch) | Điền `y=0` |
| `history_df` rỗng khi build_future | `ValueError` |

---

## FILE 2 — `app/utils/stock_calculator.py`

**Plan:** `docs/plans/2026-04-15/04-stock-calculator.md`
**Tests:** `tests/test_stock_calculator.py` — 37 tests

### Mục đích
Pure logic tính toán ngày hết hàng và số lượng đặt hàng. Không import gì ngoài
`datetime` và `pandas` — dễ test, không side effect.

### Functions

| Function | Signature | Hành vi |
|----------|-----------|---------|
| `predict_stockout_date` | `(current_stock, forecast_df) → date \| None` | stock≤0→today, tích lũy yhat1 clip âm, None nếu đủ hàng |
| `calc_suggested_qty` | `(forecast_df, safety_factor=1.2) → float` | Σyhat1(≥0) × safety_factor, round 2 chữ số |
| `calc_suggested_order_date` | `(stockout_date, lead_time_days=2) → date` | stockout−lead_time, floor=today; None→today+30 |
| `get_urgency` | `(stockout_date) → str` | ≤2 ngày→critical, ≤5→warning, else→ok |

### Logic chi tiết

#### `predict_stockout_date`

```
current_stock <= 0?  → return date.today()  (đã hết hàng)
forecast_df rỗng?    → return None

cumulative = 0
for each row in forecast_df:
    cumulative += max(yhat1, 0)   # clip âm
    if cumulative >= current_stock:
        return row["ds"].date()

return None  # tồn kho đủ trong kỳ
```

#### `get_urgency`

| `days_until = stockout_date - today` | Kết quả |
|--------------------------------------|---------|
| `stockout_date is None` | `"ok"` |
| `days_until < 0` (đã hết) | `"critical"` |
| `days_until <= 2` | `"critical"` |
| `days_until <= 5` | `"warning"` |
| `days_until > 5` | `"ok"` |

#### `calc_suggested_order_date`

```
stockout_date is None → today + 30 ngày
stockout_date có giá trị:
    suggested = stockout_date - lead_time_days
    return max(suggested, today)   ← không bao giờ trả ngày quá khứ
```

### Edge cases đã test

| Case | Kết quả |
|------|---------|
| `current_stock = 0` | stockout = today |
| `current_stock = 999_999` | stockout = None |
| `forecast_df` rỗng | stockout = None |
| `yhat1` toàn âm | stockout = None (clip hết về 0) |
| `stockout_date` hôm qua | urgency = "critical" |
| `lead_time > khoảng cách` | order_date = today |

---

## FILE 3 — `app/services/predict_service.py`

**Plan:** `docs/plans/2026-04-15/05-predict-service.md`
**Tests:** `tests/test_predict_service.py` — 21 tests

### Mục đích
Orchestrate toàn bộ pipeline predict: load model → lấy data → predict/fallback
→ tính chỉ số kho → upsert vào `forecast_results`.

### Functions

| Function | Signature | Hành vi |
|----------|-----------|---------|
| `_build_fallback_forecast` | `(history_df) → pd.DataFrame` | avg 7 ngày gần nhất → 7 future rows với yhat1 bằng nhau |
| `_upsert_forecast_results` | `(db, series_id_int, forecast_df, stockout, qty)` | INSERT ... ON CONFLICT DO UPDATE — 1 row/ngày |
| `predict_branch` | `(tenant_id, branch_id, db) → list[IngredientPrediction]` | Full flow 1 chi nhánh |
| `predict_all_branches` | `(db) → None` | Iterate tenant → branch → predict_branch |

### Luồng `predict_branch`

```
1. model_io.model_exists(tenant_id)?
   ├── False → global_is_fallback = True (log warning)
   └── True  → load_model() [nếu lỗi → fallback]

2. data_service.get_all_ingredients_of_branch(db, tenant_id, branch_id)
   └── rỗng → return []

3. Mỗi ingredient:
   a. SeriesRegistryRepo.get_or_create(ingredient_id, branch_id)
      → series_id_str="s{n}", series_id_int=n
   b. get_ingredient_consumption(db, ..., days_back=np_n_lags+14)
      → history_df [ds, y]
   c. get_current_stock(db, ...)
      → current_stock: float
   d. Predict:
      ├── is_fallback=True hoặc history rỗng
      │   → _build_fallback_forecast(history_df)
      └── else:
          build_future_df(history_df, series_id_str, periods=7)
          model.predict(future_df)
          filter ds > last_history_date → forecast_df [ds, yhat1]
          yhat1.clip(lower=0)
          [nếu exception → fallback]
   e. stock_calculator: stockout_date, suggested_qty, order_date, urgency
   f. _upsert_forecast_results(db, series_id_int, ...)
   g. append IngredientPrediction(is_fallback=...)

4. db.commit()
5. return list[IngredientPrediction]
```

### Schema `IngredientPrediction` (thêm vào `app/schemas/forecast.py`)

| Field | Type | Mô tả |
|-------|------|-------|
| `ingredient_id` | `str` | UUID nguyên liệu |
| `ingredient_name` | `str` | Tên hiển thị |
| `unit` | `str` | Đơn vị (kg, lít, g…) |
| `current_stock` | `float` | Tồn kho tại thời điểm predict |
| `stockout_date` | `date \| None` | Ngày dự kiến hết hàng |
| `suggested_order_qty` | `float` | Số lượng gợi ý nhập |
| `suggested_order_date` | `date` | Ngày nên đặt hàng |
| `urgency` | `Literal["ok","warning","critical"]` | Mức độ khẩn cấp |
| `is_fallback` | `bool` | True = dùng avg thay vì model |

### Fallback logic

| Điều kiện | Hành vi |
|-----------|---------|
| Model file chưa tồn tại | `global_is_fallback = True` — toàn branch dùng fallback |
| Load model exception | Fallback + log error |
| history_df rỗng (nguyên liệu mới) | Fallback với avg = 0.0 |
| model.predict() exception | Fallback cho ingredient đó, tiếp tục các ingredient khác |

### Upsert SQL

```sql
INSERT INTO forecast_results
    (series_id, forecast_date, predicted_qty, stockout_date, suggested_qty)
VALUES (...)
ON CONFLICT (series_id, forecast_date)
DO UPDATE SET
    predicted_qty = EXCLUDED.predicted_qty,
    stockout_date = EXCLUDED.stockout_date,
    suggested_qty = EXCLUDED.suggested_qty
```

> **Lưu ý:** `is_fallback` không có cột trong `ForecastResult` ORM — chỉ trả về
> trong Pydantic schema. Cần migration nếu muốn persist sau này.

### Exception isolation

```
predict_all_branches
├── tenant loop
│   └── branch loop
│       └── predict_branch()  ← exception → log + continue (không dừng)
│
predict_branch
└── ingredient loop
    └── mỗi ingredient  ← exception → log + continue (không dừng)
```

---

## Tổng hợp Tests

| Test file | Class | Tests | Nội dung |
|-----------|-------|-------|----------|
| `test_dataframe_builder.py` | `TestBuildGlobalDf` | 10 | Validate, fill, clip, sort |
| | `TestValidateSeries` | 10 | min_days, duplicate dates, missing cols |
| | `TestBuildFutureDf` | 10 | Length, NaN, dates, ID, empty input |
| | `TestSplitBySeries` | 6 | Keys, length, index reset |
| | `TestBuildSeriesId` | 3 | Format string |
| **Subtotal** | | **39** | |
| `test_stock_calculator.py` | `TestPredictStockoutDate` | 10 | stock=0, stock=999999, âm, empty |
| | `TestCalcSuggestedQty` | 8 | Safety factor, âm clip, round |
| | `TestCalcSuggestedOrderDate` | 8 | None, past, lead_time=0, floor |
| | `TestGetUrgency` | 11 | Các ngưỡng, quá khứ, tương lai |
| **Subtotal** | | **37** | |
| `test_predict_service.py` | `TestBuildFallbackForecast` | 7 | avg, empty, dates |
| | `TestPredictBranchFallback` | 2 | No model → fallback |
| | `TestPredictBranchWithModel` | 3 | Model.predict, exception, empty history |
| | `TestPredictBranchEdgeCases` | 6 | Empty, skip, commit, upsert count, urgency |
| | `TestPredictAllBranches` | 3 | Count calls, no tenant, exception isolation |
| **Subtotal** | | **21** | |
| **TOTAL** | | **97/97** ✅ | |

---

## Dependencies giữa các file

```
predict_service.py
├── data_service.py          (get_all_active_tenants, get_all_active_branches,
│                             get_all_ingredients_of_branch,
│                             get_ingredient_consumption, get_current_stock)
├── model_io.py              (model_exists, load_model)
├── SeriesRegistryRepo       (get_or_create → series_id_int)
├── dataframe_builder.py     (build_future_df)
├── stock_calculator.py      (predict_stockout_date, calc_suggested_qty,
│                             calc_suggested_order_date, get_urgency)
└── schemas/forecast.py      (IngredientPrediction)

dataframe_builder.py
└── (không phụ thuộc gì ngoài pandas + app logger)

stock_calculator.py
└── (chỉ datetime + pandas — pure logic)
```

---

## Lưu ý kỹ thuật

### NeuralProphet predict flow
Khi dùng Global Model với cột `ID`:
- Input: `future_df` có cột `[ds, y, ID]` — history rows (y=actual) + future rows (y=NaN)
- Output: DataFrame với `yhat1` (1-step-ahead) tại mỗi row
- Lấy kết quả: filter `ds > last_history_date` → 7 rows tương lai → dùng `yhat1`

### series_id format
- `AiSeriesRegistry.id` (integer) → `series_id` property → `"s{id}"` string
- `ForecastResult.series_id` là integer FK → dùng `series_entry.id` khi upsert
- `build_future_df` nhận `series_id_str = "s{n}"` cho cột `ID` của NeuralProphet

### Transaction boundary
- `_upsert_forecast_results` không commit — chỉ execute
- `predict_branch` commit 1 lần sau khi xử lý xong tất cả ingredients
- Nếu predict_branch raise exception giữa chừng → transaction chưa commit → data consistent
