# Plan: Tích hợp Weather Regressor vào NeuralProphet

**Ngày:** 2026-04-21
**Mục tiêu:** Dùng nhiệt độ + lượng mưa từ Open-Meteo làm `future_regressor` trong NeuralProphet để cải thiện dự báo tiêu thụ F&B (thời tiết nóng → bán nhiều đồ lạnh, mưa → giảm khách).

---

## Checklist

- [x] Thêm `fetch_historical_weather_for_branch()` vào `weather_service.py` (Open-Meteo Archive API)
- [x] Tích hợp weather vào `train_service.py`:
  - Fetch historical weather trong `run_train_for_branch()`
  - Merge weather vào df trước khi train
  - `model.add_future_regressor("temperature", "precipitation")`
  - Lưu `use_weather_regressor` vào `train_metadata.json`
- [x] Tích hợp weather vào `predict_service.py`:
  - Pre-fetch weather cho toàn branch (1 lần cho tất cả ingredients)
  - Merge weather vào `future_df` trước `model.predict()`
- [ ] Chạy lại train để kiểm tra WAPE có cải thiện

---

## Kiến trúc

```
Training:
  run_train_for_branch() [async]
    → fetch_historical_weather_for_branch()  ← NEW (Open-Meteo Archive API)
    → get_weather_df()                        ← từ cache
    → train_branch_model(df, weather_df=...)  ← signature mới

  train_branch_model() [sync]
    → merge weather vào df_clean (left join theo ds)
    → model.add_future_regressor("temperature")
    → model.add_future_regressor("precipitation")
    → model.fit(df_with_weather)
    → save use_weather_regressor=True trong config

Prediction:
  predict_branch() [async]
    → đọc use_weather_regressor từ model config
    → fetch_weather_for_branch()              ← 8-day forecast
    → fetch_historical_weather_for_branch()   ← history window
    → get_weather_df() 1 lần cho toàn branch
    → với mỗi ingredient: merge weather vào future_df
```

## Quy tắc an toàn

- **Weather là optional** — mọi lỗi API đều bị bắt, train/predict vẫn chạy
- **Coverage threshold 70%** — nếu < 70% ngày có weather data → bỏ qua regressor
- **Backward compatible** — model cũ không có `use_weather_regressor` → dùng `False` (mặc định)
- **Median fill** — ngày thiếu weather được điền bằng median của chuỗi
