---
plan: 03-dataframe-builder
date: 2026-04-15
status: in_progress
---

# Plan: DataFrame Builder

## Mục tiêu
Cung cấp các utility function làm sạch và chuẩn bị DataFrame đúng format
NeuralProphet — tách biệt khỏi service layer để dễ test và tái sử dụng.

## Checklist

- [x] `build_global_df(raw_df)` — validate, fill missing dates, clip âm
- [x] `validate_series(df, min_days)` — dict[id → bool] đủ/không đủ ngày
- [x] `build_future_df(history_df, series_id, periods)` — history + future rows
- [x] `split_by_series(df)` — dict[id → DataFrame]
- [x] Giữ `build_series_id` từ file cũ
- [x] Unit tests đầy đủ tại `tests/test_dataframe_builder.py`

## File ảnh hưởng
- `app/utils/dataframe_builder.py` — rewrite
- `tests/test_dataframe_builder.py` — tạo mới

## Thiết kế

### `build_global_df`
1. Validate cột bắt buộc `{ds, y, ID}`
2. Validate ds là datetime64 (dùng `pd.api.types.is_datetime64_any_dtype`)
3. Clip y âm về 0 (log warning nếu có)
4. Với mỗi series (groupby ID):
   - Xác định `[min_date, max_date]`
   - Tạo `full_range` từ min → max theo freq D
   - Left merge để điền y=0 cho ngày trống
5. Concat tất cả series, sort theo (ID, ds)

### `validate_series`
- `groupby("ID")["ds"].nunique()` → so sánh với min_days
- Return `dict[str, bool]`

### `build_future_df`
- Lấy `last_date` từ history_df
- Tạo future dates: `date_range(last_date+1, periods=periods, freq=D)`
- Future rows: y=NaN, ID=series_id
- History rows: giữ ds, y, thêm ID=series_id
- Concat → sort theo ds

### `split_by_series`
- `{sid: group.reset_index() for sid, group in df.groupby("ID")}`

## Notes
- `build_future_df` bao gồm TOÀN BỘ lịch sử + tương lai — NeuralProphet tự
  dùng n_lags hàng cuối, không cần cắt bớt ở đây.
- Không import app layer (trừ logger) — file này là pure util.
