# Plan: app/services/weather_service.py + migration weather_cache
> Ngày: 2026-04-15 | Session 6 — TASK B

## Mục tiêu

Implement weather service tích hợp Open-Meteo API (miễn phí, không cần key).
Weather là OPTIONAL — nếu API lỗi, train/predict vẫn chạy bình thường.

## Bảng weather_cache (migration 002)

```sql
CREATE TABLE weather_cache (
    id            SERIAL PRIMARY KEY,
    branch_id     VARCHAR NOT NULL,
    date          DATE NOT NULL,
    temperature   FLOAT,       -- °C max trong ngày
    precipitation FLOAT,       -- mm lượng mưa
    cached_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (branch_id, date)
);
```

## 3 Functions

| Function | Input | Output |
|----------|-------|--------|
| `fetch_weather_for_branch` | branch_id, db | bool (True=OK, False=skip/lỗi) |
| `get_weather_df` | branch_id, dates[], db | DataFrame(ds, temperature, precipitation) \| None |
| `fetch_all_branches_weather` | db | None (log kết quả) |

## Luồng fetch_weather_for_branch

```
1. Query branches WHERE id::text = branch_id → (lat, lng)
2. Nếu lat/lng NULL → log warning, return False
3. Check cache: SELECT 1 FROM weather_cache WHERE branch_id=? AND date=TODAY
   Nếu có → return True (đã cache)
4. Gọi Open-Meteo: GET https://api.open-meteo.com/v1/forecast
   params: latitude, longitude, daily=[temperature_2m_max, precipitation_sum],
           timezone=Asia/Ho_Chi_Minh, forecast_days=8
5. Parse → UPSERT vào weather_cache (8 ngày)
6. httpx exception → log warning, return False
```

## Ghi chú
- `httpx` đã có trong requirements.txt (v0.27.2)
- Timeout: 10 giây
- UPSERT: INSERT ... ON CONFLICT (branch_id, date) DO UPDATE
- Không cần model_registry — weather dùng raw SQL text()
