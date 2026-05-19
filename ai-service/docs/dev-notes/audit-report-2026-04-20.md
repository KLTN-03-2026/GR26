# 🔍 Audit Report — SmartF&B AI Service
**Ngày kiểm tra:** 2026-04-20
**Người kiểm tra:** Claude Code Reviewer
**Branch:** dev
**Phương pháp:** Đọc toàn bộ source, grep, chạy test suite

---

## 📊 Tổng quan nhanh

| Hạng mục | Tổng | ✅ Xong | 🔄 Stub | ❌ Thiếu |
|----------|------|---------|---------|---------|
| File source (.py) | 29 | 28 | 1 | 0 |
| Function/method (so với checklist) | ~90 | ~88 | 1 | 1 |
| Test file | 6 | 6 | 0 | 0 |
| Test case | 166 | 137 | 0 | 29 (FAIL) |

---

## ✅ Đã hoàn thành đầy đủ

### Core
- `app/core/config.py` — class `Settings` đầy đủ: database_url, jwt_secret, jwt_algorithm, model_storage_dir, np_n_lags, np_n_forecasts, np_epochs, train/predict/weather cron, alert_webhook_url. Validator production từ chối "changeme".
- `app/core/database.py` — async engine, SessionLocal, get_db() async generator, connection pool (size=5, max_overflow=10).
- `app/core/security.py` — class `TokenPayload`, `verify_token()`, `extract_tenant_id()`. Hỗ trợ camelCase claims từ Spring Boot (tenantId/tenant_id).
- `app/core/logging.py` — 5 handler (console, app.log, train.log, warning.log, combined.log), xoay theo ngày, thread-safe với lock.

### API
- `app/api/deps.py` — `get_db()`, `get_current_tenant()`, `verify_branch_access()`.
- `app/api/v1/health.py` — GET /health trả về status DB, scheduler, model count.
- `app/api/v1/forecast.py` — GET /forecast/{branch_id}, /summary, /{ingredient_id}. Caching 5 phút.
- `app/api/v1/train.py` — POST /train/trigger, PUT /train/config, GET /train/config, GET /train/status, POST /train/predict. RBAC: chỉ OWNER/ADMIN.
- `app/api/v1/series.py` — GET /series/{branch_id} (debug endpoint, ngoài plan gốc — giá trị thêm).

### Models (SQLAlchemy)
- `app/models/series_registry.py` — `AiSeriesRegistry`, UNIQUE(ingredient_id, branch_id).
- `app/models/forecast_result.py` — `ForecastResult`, UNIQUE(series_id, forecast_date).
- `app/models/train_log.py` — `TrainLog`, trigger_type.
- `app/models/model_registry.py` — `ModelRegistry`, per-branch tracking với is_active.
- `app/models/consumption_history.py` — cache tiêu thụ, UNIQUE(series_id, ds). *(ngoài plan gốc)*
- `app/models/train_config.py` — config per-branch, UNIQUE(tenant_id, branch_id). *(ngoài plan gốc)*

### Schemas
- `app/schemas/forecast.py` — `DayForecast`, `IngredientForecast` (có `is_fallback`), `ForecastResponse` (có `last_trained_at`, computed `urgent_count`/`warning_count`), `ForecastSummary`.

### Repositories
- `app/repositories/series_registry_repo.py` — `get_or_create()` (INSERT ON CONFLICT), `get_by_series_id()`, `get_all_by_branch()`.

### Services
- `app/services/data_service.py` (827 dòng) — `get_all_consumption_for_tenant()`, `get_recent_consumption()`, `get_current_stock()`, `get_active_ingredients()` (trả về min_stock từ inventory_balances), `get_active_tenants()`, `get_branch_coordinates()`. Mọi query filter tenant_id.
- `app/services/train_service.py` (498 dòng) — `validate_training_data()`, `train_tenant()` (có `torch.manual_seed(42)` + `np.random.seed(42)` + `random.seed(42)`), `train_all_tenants()`, `get_latest_train_status()`.
- `app/services/predict_service.py` (433 dòng) — `predict_branch()` (min_stock truyền vào calculator, Option C: skip nếu chưa có model), `predict_all_branches()`, fallback moving average khi model predict thất bại.
- `app/services/weather_service.py` (221 dòng) — `fetch_weather_for_branch()` (gọi Open-Meteo API, UPSERT cache), `get_weather_df()`, `fetch_all_branches_weather()`.

### Utils
- `app/utils/model_io.py` — `save_model()` (dùng `neuralprophet.save()`, không pickle), `load_model()` (xử lý file corrupt), `model_exists()`, `get_train_metadata()`, `list_all_models()`. Per-branch path: `storage/models/{tenant_id}/{branch_id}/`.
- `app/utils/dataframe_builder.py` — `build_series_id()`, `build_global_df()`, `validate_series()`, `build_future_df()`, `split_by_series()`.
- `app/utils/stock_calculator.py` — `predict_stockout_date()` (có `min_stock`), `calc_suggested_qty()`, `calc_suggested_order_date()` (dùng `avg_daily_consumption` khi stockout=None, KHÔNG hardcode +30 cứng), `get_urgency()`, `calc_avg_daily_consumption()`.

### Scheduler
- `app/scheduler/jobs.py` — 3 jobs với try/except: train (CN 2h sáng), predict (0h30), weather (6h).
- `app/scheduler/runner.py` — `start_scheduler()` (3 jobs + misfire_grace_time), `stop_scheduler()`. Timezone Asia/Ho_Chi_Minh.

### App entrypoint
- `app/main.py` — dùng `lifespan` context manager (không dùng `@app.on_event` deprecated). Mount đủ routers: health, forecast, train, series.

### Migrations (Alembic)
- `alembic/versions/001_init_ai_tables.py` — forecast_results, train_logs, ai_series_registry.
- `alembic/versions/002_add_weather_cache.py` — weather_cache table.
- `alembic/versions/003_per_branch_config.py` — ai_train_config, model_registry, consumption_history.

---

## 🔄 Stub — có file nhưng chưa implement

### `app/services/event_service.py` (40 dòng)
- **Function stub:** `get_branch_events()` — trả về `[]` với comment `"chưa implement"`.
- **Dòng 36:** `# Placeholder — chưa implement. Trả về list rỗng để không block train/predict.`
- **Tác động:** Thấp — train/predict hoạt động bình thường, event chưa tích hợp vào NeuralProphet regressors.

---

## ❌ Thiếu hoàn toàn — chưa tạo file

**Không có file nào thiếu hoàn toàn.** Toàn bộ file trong checklist CLAUDE.md đều tồn tại.

File bổ sung ngoài plan gốc (bonus):
- `app/services/event_service.py` (stub — xem trên)
- `app/models/consumption_history.py`
- `app/models/train_config.py`
- `app/api/v1/series.py`
- `app/repositories/` directory
- `scripts/` (e2e_test.py, evaluate_model.py, validate_suggestions.py)

---

## ⚠️ Vấn đề cần fix

### Nghiêm trọng (chặn deploy / chặn CI)

- [ ] **29 test FAIL — cần fix trước khi merge** (xem chi tiết phần Tests bên dưới)
  - 18 fail trong `test_model_io.py` — function signature lỗi thời
  - 10 fail trong `test_predict_service.py` — mock không khớp behavior hiện tại (Option C)
  - 1 fail trong `test_stock_calculator.py` — boundary condition sai

### Trung bình (nên fix trước release)

- [ ] **`schemas/train.py` — `TrainResult` thiếu field `series_skipped: list[str]`**
  Hiện chỉ có `series_count: int`. Không biết series nào bị skip (data thiếu ngày). Ảnh hưởng khả năng debug và hiển thị thông tin cho user.
  - File: `app/schemas/train.py` dòng 24–39

- [ ] **`event_service.py` — chưa implement**
  Sự kiện đặc biệt (khai trương, khuyến mãi) chưa được tích hợp vào NeuralProphet regressors. Dự báo sẽ kém chính xác khi quán có sự kiện bất thường.
  - File: `app/services/event_service.py` dòng 36

### Nhỏ (nice to have)

- [ ] **`pytest-asyncio` deprecation warning** — `asyncio_default_fixture_loop_scope` chưa set trong `pytest.ini` / `pyproject.toml`. Không ảnh hưởng runtime nhưng cần fix để test output sạch.

- [ ] **`model_registry.py` — không có UNIQUE constraint** trên cặp `(tenant_id, branch_id)` trong SQLAlchemy model class (dù migration 003 có thể đã thêm). Cần kiểm tra migration có enforce constraint không.
  - File: `app/models/model_registry.py` dòng 16–48

- [ ] **`schemas/train.py` — `TrainStatusResponse` có `mape` field** nhưng `TrainResult` không có `mape`. Cần nhất quán: nếu MAPE được tính và lưu vào `model_registry`, cũng nên expose qua `TrainResult`.
  - File: `app/schemas/train.py` dòng 122–137 vs dòng 24–39

---

## 🧪 Trạng thái Tests

### Kết quả chạy `pytest tests/ -v --tb=short`

```
166 tests collected
137 PASSED
 29 FAILED
  0 ERROR
Thời gian: 1.93s
```

### Chi tiết FAIL

#### 1. `test_model_io.py` — 18 FAIL (signature lỗi thời)

**Root cause:** `save_model()`, `load_model()`, `model_exists()`, `get_train_metadata()` đã được refactor sang per-branch storage (migration 003), cần thêm `branch_id` parameter. Tests vẫn gọi với signature cũ (thiếu `branch_id`).

```python
# Test gọi (cũ — SAI):
model_io.save_model(fake_model, "tenant_a")

# Signature thực tế (mới):
def save_model(model, tenant_id: str, branch_id: str) -> Path: ...
```

Danh sách test fail:
- `TestSaveModel` — 5 test
- `TestLoadModel` — 5 test
- `TestModelExists` — 3 test
- `TestGetTrainMetadata` — 3 test
- `TestListAllModels` — 2 test (assert format path bị thay đổi)

**Fix:** Cập nhật toàn bộ test call trong `tests/test_model_io.py` thêm `branch_id="branch_a"`.

---

#### 2. `test_predict_service.py` — 10 FAIL (mock không khớp Option C)

**Root cause A — Option C behavior:** Tests mock `model_io.model_exists.return_value = False` và expect predict_service dùng **fallback moving average**, nhưng code hiện tại implement **Option C: skip branch khi chưa có model** (không predict gì cả, log warning, return `[]`).

```
WARNING: Branch branch-1 chưa có model → skip predict (Option C).
```

Ảnh hưởng: `TestPredictBranchFallback` (2 test), `TestPredictBranchEdgeCases` (6 test).

**Root cause B — Mock type mismatch:** Một số test mock `model_io.get_model_config()` return MagicMock object. Code dùng kết quả làm `int/float`, gây `TypeError: '<=' not supported between instances of 'int' and 'MagicMock'`.

Ảnh hưởng: `TestPredictBranchWithModel` (2 test).

**Fix:** Cập nhật tests để:
- Mock `model_io.model_exists.return_value = True` khi muốn test predict thực sự
- Mock `model_io.get_model_config.return_value = {"n_forecasts": 7, "n_lags": 14}` (dict thật, không MagicMock)
- Tách test riêng cho "branch chưa có model → return []"

---

#### 3. `test_stock_calculator.py` — 1 FAIL (boundary sai)

**Root cause:** `TestGetUrgency::test_stockout_in_six_days_is_ok` expect +6 ngày = "ok" với default `n_forecasts=7`. Nhưng logic: `days_until <= n_forecasts` → 6 <= 7 → "warning".

```python
# Test (SAI):
assert get_urgency(date.today() + timedelta(days=6)) == "ok"

# Logic thực tế:
if days_until <= n_forecasts:  # 6 <= 7 → True → "warning"
    return "warning"
```

**Fix:** Sửa test thành `timedelta(days=8)` để đúng boundary, hoặc gọi `get_urgency(..., n_forecasts=5)`.

---

### File có test — coverage tốt

| Test File | PASS | FAIL | Ghi chú |
|-----------|------|------|---------|
| test_data_service.py | 20 | 0 | ✅ Đầy đủ |
| test_dataframe_builder.py | 39 | 0 | ✅ Đầy đủ |
| test_model_io.py | 3 | 18 | ❌ Signature lỗi thời |
| test_predict_service.py | 13 | 10 | ❌ Mock không khớp behavior |
| test_stock_calculator.py | 61 | 1 | ⚠️ 1 boundary sai |
| test_security.py | 11 | 0 | ✅ Đầy đủ |

### File KHÔNG có test tương ứng

| File cần test | Lý do cần |
|--------------|-----------|
| `app/services/weather_service.py` | Logic parse Open-Meteo response + UPSERT cache cần test với mock httpx |
| `app/services/train_service.py` | Train pipeline quan trọng — cần test `validate_training_data()`, seed, skip logic |
| `app/services/event_service.py` | Stub, chưa cần |
| `app/repositories/series_registry_repo.py` | CRUD DB — cần integration test hoặc mock |
| `app/api/v1/forecast.py` | API endpoint — cần integration test với TestClient |
| `app/api/v1/train.py` | API endpoint — cần integration test với TestClient |

---

## 🔐 Checklist Multi-Tenant

| Kiểm tra | Kết quả |
|---------|---------|
| Mọi query có `tenant_id` filter | ✅ data_service.py — tất cả WHERE có tenant_id |
| Model file lưu theo `{tenant_id}/{branch_id}/` | ✅ model_io.py — per-branch path |
| JWT validate tenant_id | ✅ security.py — HTTP 403 nếu thiếu |
| Branch access check | ✅ deps.py — verify branch belongs to tenant |
| Role-based access train trigger | ✅ train.py API — chỉ OWNER/ADMIN |

---

## 🧠 Checklist NeuralProphet

| Kiểm tra | Kết quả |
|---------|---------|
| Dùng `neuralprophet.save()` không pickle | ✅ model_io.py |
| `add_country_holidays("VN")` | ✅ train_service.py |
| `torch.manual_seed(42)` | ✅ train_service.py dòng 144 |
| DataFrame validate trước train | ✅ validate_training_data() — NaN, âm, min 30 ngày |
| API chỉ đọc DB, không chạy model | ✅ forecast.py — SELECT from forecast_results |
| min_stock truyền vào calculator | ✅ predict_service.py → stock_calculator |
| calc_suggested_order_date không hardcode +30 | ✅ dùng avg_daily_consumption |

---

## 📋 Checklist Code Quality

| Kiểm tra | Kết quả |
|---------|---------|
| `print()` debug | ✅ 0 instances |
| `NotImplementedError` | ✅ 0 instances |
| `TODO/FIXME` trong app/ | ✅ 0 instances |
| `import pickle` | ✅ 0 instances |
| Hardcode credentials | ✅ Không — dùng .env + validation |
| Type hints đầy đủ | ✅ Tất cả function public |
| Docstring tiếng Việt | ✅ Tất cả function public |
| `@app.on_event` deprecated | ✅ Dùng `lifespan` |

---

## 📁 Cấu trúc thực tế vs Kỳ vọng

```
✅ app/main.py
✅ app/core/config.py
✅ app/core/database.py
✅ app/core/security.py
✅ app/core/logging.py          (ngoài plan gốc — giá trị thêm)
✅ app/api/v1/forecast.py
✅ app/api/v1/train.py
✅ app/api/v1/health.py
✅ app/api/v1/series.py         (ngoài plan gốc — debug endpoint)
✅ app/api/deps.py
✅ app/models/series_registry.py
✅ app/models/forecast_result.py
✅ app/models/train_log.py
✅ app/models/model_registry.py
✅ app/models/consumption_history.py  (ngoài plan gốc)
✅ app/models/train_config.py         (ngoài plan gốc)
✅ app/repositories/series_registry_repo.py
✅ app/schemas/forecast.py
⚠️ app/schemas/train.py         (thiếu series_skipped: list[str] trong TrainResult)
✅ app/services/data_service.py
✅ app/services/train_service.py
✅ app/services/predict_service.py
✅ app/services/weather_service.py
🔄 app/services/event_service.py  (stub — placeholder)
✅ app/scheduler/jobs.py
✅ app/scheduler/runner.py
✅ app/utils/model_io.py
✅ app/utils/dataframe_builder.py
✅ app/utils/stock_calculator.py
```

---

## 🎯 Kết luận & Ưu tiên Action Items

### Phải làm ngay (trước khi merge dev → main):

1. **Fix 29 test FAIL** — không thể merge khi CI đỏ
   - `test_model_io.py`: Thêm `branch_id` vào tất cả test call
   - `test_predict_service.py`: Cập nhật mock cho Option C và get_model_config
   - `test_stock_calculator.py`: Sửa 1 assertion boundary

### Nên làm trong sprint này:

2. **Thêm `series_skipped: list[str]` vào `TrainResult`** — hữu ích cho debug và UX
3. **Thêm test cho `weather_service.py`** — logic HTTP + UPSERT cần coverage
4. **Fix pytest deprecation warning** — thêm `asyncio_default_fixture_loop_scope = function` vào `pytest.ini`

### Backlog (sau MVP):

5. **Implement `event_service.py`** — tích hợp sự kiện đặc biệt vào NeuralProphet regressors
6. **Thêm integration tests** cho API endpoints (TestClient)
7. **Thêm test cho `train_service.py`** — train pipeline là core logic quan trọng nhất
