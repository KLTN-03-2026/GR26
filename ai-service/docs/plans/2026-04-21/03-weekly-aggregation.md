# Plan: Weekly Aggregation cho Intermittent/Sparse Demand

**Ngày:** 2026-04-21
**Vấn đề:** F&B có nhiều nguyên liệu chỉ bán vài ngày/tháng (cà phê mùa lạnh, nguyên liệu món đặc biệt).
NeuralProphet trên daily data với nhiều ngày y=0 → mô hình học toàn zero → dự báo sai.

**Giải pháp:** Gộp data theo tuần cho intermittent/sparse series.

---

## Phân loại demand pattern

| Pattern       | Điều kiện                | Model | Freq |
|---------------|--------------------------|-------|------|
| regular       | ≥ 70% ngày có tiêu thụ  | daily  | D    |
| intermittent  | 25–70% ngày có tiêu thụ | weekly | W    |
| sparse        | < 25% ngày có tiêu thụ  | weekly | W    |

---

## Kiến trúc mới

```
storage/models/{tenant_id}/{branch_id}/
    model_daily.np          ← regular series
    model_weekly.np         ← intermittent + sparse series
    train_metadata.json     ← shared, có series_classification
```

---

## Checklist

### PHẦN 1 — dataframe_builder.py
- [x] `classify_demand_pattern(df_series) -> str`
- [x] `split_by_demand_pattern(df) -> dict`
- [x] `aggregate_to_weekly(df) -> pd.DataFrame`
- [x] `build_future_df()` — thêm param `freq: str = "D"`

### PHẦN 2 — train_service.py
- [x] Split df theo demand pattern
- [x] Train `model_daily` cho regular
- [x] Train `model_weekly` cho intermittent + sparse (weekly-aggregated)
- [x] Save cả 2 model với `model_type`
- [x] Ghi `series_classification` vào metadata

### PHẦN 3 — model_io.py
- [x] `save_model(..., model_type="daily")` → `model_{type}.np`
- [x] `load_model(..., model_type="daily")` — fallback `model.np` nếu chưa có `model_daily.np`
- [x] `model_exists()` — check `model_daily.np` OR old `model.np`
- [x] `list_all_models()` — cập nhật

### PHẦN 4 — predict_service.py
- [x] Load cả 2 model (`model_daily`, `model_weekly`)
- [x] Đọc `series_classification` từ `get_train_metadata()`
- [x] Route: regular → daily model, còn lại → weekly model
- [x] `_expand_weekly_to_daily()` để convert weekly forecast → daily
- [x] Backward compat: không có `series_classification` → tất cả dùng daily model

### PHẦN 5 — Tests
- [x] 5 tests mới trong `test_dataframe_builder.py`

---

## Luồng chi tiết

```
train_branch_model(df, weather_df):
  split_by_demand_pattern(df) → {regular, intermittent, sparse}

  if regular series:
      model_daily = NeuralProphet(n_forecasts=7, n_lags=28, freq="D")
      [merge weather nếu use_weather=True]
      model_daily.fit(regular_df)
      save_model(model_daily, model_type="daily")

  if intermittent/sparse series:
      weekly_df = aggregate_to_weekly(concat(intermittent, sparse))
      model_weekly = NeuralProphet(n_forecasts=4, n_lags=8, freq="W")
      model_weekly.fit(weekly_df)
      save_model(model_weekly, model_type="weekly")

  update metadata: series_classification + model_paths

predict_branch():
  model_daily  = load_model("daily")   # None if not trained
  model_weekly = load_model("weekly")  # None if not trained
  classification = get_train_metadata()["series_classification"]
  regular_ids  = set(classification.get("regular", []))

  for ingredient:
    if series_id in regular_ids and model_daily:
      → daily predict (7 ngày)
    elif model_weekly:
      → weekly predict (4 tuần) → expand to daily
    else:
      → fallback moving average
```
