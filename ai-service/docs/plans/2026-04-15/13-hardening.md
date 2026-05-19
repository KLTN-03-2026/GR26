# Plan: Hardening + Fix
> Ngày: 2026-04-15 | Session 7 — TASK A + C

## Phân tích vấn đề

### Bugs nghiêm trọng cần fix

| Vấn đề | File | Mức độ |
|--------|------|--------|
| `train_service.py` import `get_active_tenants`, `get_all_consumption_for_tenant` không tồn tại | train_service.py + data_service.py | CRITICAL — crash khi chạy |
| `test_data_service.py` test 6 functions chưa có | data_service.py | HIGH — 100% tests fail |

### Hardening

| Item | File | Thay đổi |
|------|------|----------|
| DB pool config | database.py | pool_size=5, max_overflow=10, pool_timeout=30, pool_recycle=1800 |
| Config validation | config.py | Thêm `env` field + `@model_validator` check jwt_secret trong production |
| Health check | health.py | Thêm scheduler_status, models_loaded |
| Train series filter | train_service.py | Filter series < MIN_DAYS trước khi train, log skip |

## Functions cần thêm vào data_service.py

1. `get_active_tenants` — alias của `get_all_active_tenants`
2. `get_branch_coordinates(db, branch_id) -> tuple[float,float] | None`
3. `get_recent_consumption(db, series_id, days) -> pd.DataFrame` — query consumption_history
4. `_build_and_fill(day_rows, start_date, series_id) -> pd.DataFrame` — pure function
5. `get_active_ingredients(db, tenant_id, branch_id) -> list[dict]` — kèm series_id
6. `get_all_consumption_for_tenant(db, tenant_id, days_back) -> pd.DataFrame` — cho train job

## Fix train_service.py

- Fix import: `get_active_tenants` (alias đã thêm), `get_all_consumption_for_tenant` (mới)
- Thêm `_filter_valid_series(df)`: trả lại DataFrame chỉ giữ series có >= 30 ngày, log series bị skip
- Nếu tất cả series bị filter → raise ValueError → status="skipped"
