# Plan: Hoàn thiện app/schemas/forecast.py + train.py
> Ngày: 2026-04-15 | Session 4 — TASK B

## Mục tiêu

Nâng cấp 2 schema files từ bản thiếu thành đầy đủ:

### forecast.py
- `DayForecast` ✅ giữ nguyên
- `IngredientForecast` — thêm `current_stock`, `urgency`, `is_fallback`
- `ForecastResponse` — thêm `last_trained_at`, computed properties `urgent_count`, `warning_count`
- **Mới**: `ForecastSummary` — response nhẹ cho dashboard
- `IngredientPrediction` ✅ đã có từ Session 3

### train.py
- `TrainTriggerResponse` ✅ giữ nguyên
- `TrainStatusResponse` — sửa fields, thêm `model_exists`, làm optional hợp lý
- **Mới**: `TrainRequest`, `TrainResult`

## Checklist

- [ ] `IngredientForecast`: thêm `current_stock`, `urgency`, `is_fallback`
- [ ] `ForecastResponse`: thêm `last_trained_at`, `urgent_count`, `warning_count`
- [ ] `ForecastSummary`: class mới với 6 fields tổng quan
- [ ] `TrainRequest`: `tenant_id: str | None = None`
- [ ] `TrainResult`: status Literal, mae, duration_seconds, error
- [ ] `TrainStatusResponse`: thêm `model_exists: bool`, align fields
- [ ] Tất cả class có `model_config = ConfigDict(from_attributes=True)`
- [ ] Docstring tiếng Việt cho mỗi class

## Lưu ý

- `ForecastResponse.urgent_count` / `warning_count` là `@property` — Pydantic v2 cần `model_config` hoặc dùng `@computed_field`
- Pydantic v2: dùng `@computed_field` từ `pydantic` để expose property trong serialization
