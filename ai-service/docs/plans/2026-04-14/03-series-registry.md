# Plan: AI Series Registry + Alembic Migration

**Status:** ✅ DONE
**Service:** ai-service
**Ngày bắt đầu:** 14/04/2026
**Assignee:** @hoang

---

## Mô tả

Thiết kế lại toàn bộ schema AI Service:
- Dùng **Alembic** (thay Flyway) để quản lý migration riêng cho AI tables
- Giới thiệu `ai_series_registry` — bảng ánh xạ (ingredient_id × branch_id) → integer series_id
- Thống nhất dùng **Integer PK** thay UUID cho toàn bộ bảng AI
- `series_id` dạng `"s{id}"` (e.g. "s42") để NeuralProphet Global Model nhận diện

---

## Schema mới (thứ tự tạo)

```
ai_series_registry        ← phải tạo TRƯỚC (các bảng sau FK vào đây)
  id: Integer PK
  ingredient_id: UUID (ref tới items.id của BE — không có FK vì cross-schema)
  branch_id: UUID (ref tới branches.id của BE)
  created_at: DateTime
  UNIQUE(ingredient_id, branch_id)

consumption_history       ← lưu lịch sử tiêu thụ thực tế (phục vụ train)
  id: Integer PK
  series_id: Integer FK → ai_series_registry.id
  ds: Date
  y: Float (>= 0)
  UNIQUE(series_id, ds)

forecast_results          ← kết quả dự báo 7 ngày (BE đọc để serve FE)
  id: Integer PK
  series_id: Integer FK → ai_series_registry.id
  forecast_date: Date
  predicted_qty: Float (>= 0)
  stockout_date: Date (nullable)
  suggested_qty: Float (nullable)
  created_at: DateTime
  UNIQUE(series_id, forecast_date)

model_registry            ← track model đã train theo tenant
  id: Integer PK
  tenant_id: String (UUID from BE)
  model_path: String
  trained_at: DateTime
  series_count: Integer
  mae: Float (nullable)
  is_active: Boolean DEFAULT true
  created_at: DateTime

train_logs                ← log mỗi lần chạy train job
  id: Integer PK
  tenant_id: String (UUID from BE)
  started_at: DateTime
  finished_at: DateTime (nullable)
  status: String — running | success | failed
  series_count: Integer (nullable)
  mae: Float (nullable)
  error_message: Text (nullable)
  trigger_type: String — scheduled | manual
  created_at: DateTime
```

---

## Files tạo mới / sửa đổi

### Models
- [ ] `app/models/series_registry.py`       — AiSeriesRegistry (mới)
- [ ] `app/models/consumption_history.py`   — ConsumptionHistory (mới)
- [ ] `app/models/model_registry.py`        — ModelRegistry (mới)
- [x] `app/models/forecast_result.py`       — cập nhật: UUID → Integer PK, thêm series_id FK
- [x] `app/models/train_log.py`             — cập nhật: UUID → Integer PK, thêm trigger_type

### Repositories
- [ ] `app/repositories/__init__.py`
- [ ] `app/repositories/series_registry_repo.py`

### Alembic
- [ ] `requirements.txt`         — thêm alembic
- [ ] `alembic.ini`              — config
- [ ] `alembic/env.py`           — async setup
- [ ] `alembic/versions/001_init_ai_tables.py` — single clean migration

### API
- [ ] `app/api/v1/series.py`     — GET /api/v1/series/{branch_id}
- [x] `app/main.py`              — mount router series

---

## Checklist

### 1. Alembic setup
- [ ] Cài alembic vào venv
- [ ] `alembic init alembic`
- [ ] Cấu hình `alembic/env.py` dùng async engine + import tất cả models
- [ ] Sửa `alembic.ini` dùng DATABASE_URL từ .env

### 2. Models
- [ ] `AiSeriesRegistry` — Integer PK, UNIQUE(ingredient_id, branch_id), property series_id
- [ ] `ConsumptionHistory` — FK series_id, UNIQUE(series_id, ds)
- [ ] `ForecastResult` — redesign: Integer PK, FK series_id
- [ ] `ModelRegistry` — track model files
- [ ] `TrainLog` — Integer PK, thêm trigger_type

### 3. Migration
- [ ] Drop bảng cũ nếu còn sót (safe check)
- [ ] Tạo đúng thứ tự: registry → history → forecast → model → log
- [ ] Test: `alembic upgrade head` chạy không lỗi

### 4. Repository
- [ ] `get_or_create(ingredient_id, branch_id)` — INSERT ON CONFLICT DO NOTHING
- [ ] `get_by_series_id("s42")` — parse int, query by id
- [ ] `get_all_by_branch(branch_id)` — list all series của 1 branch

### 5. API & Integration
- [ ] GET /api/v1/series/{branch_id} — debug endpoint
- [ ] Mount router trong main.py
- [ ] Test endpoint chạy đúng

---

## Lưu ý

- `ingredient_id` và `branch_id` là UUID string từ BE — lưu dạng UUID column, không có FK ngoại
- `series_id` property trả string `f"s{self.id}"` — đúng format NeuralProphet Global Model
- Alembic chạy **độc lập** với Flyway của BE — không conflict
