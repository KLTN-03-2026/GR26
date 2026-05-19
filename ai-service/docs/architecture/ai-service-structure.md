# 🏗️ SmartF&B AI Service — Kiến trúc & Cấu trúc Chi tiết

## 1. Tổng quan

AI Service là một microservice Python độc lập, chịu trách nhiệm:
- **Train** mô hình NeuralProphet dự báo tiêu thụ nguyên liệu (offline, theo lịch)
- **Predict** kết quả 7 ngày tới và tính toán gợi ý nhập kho (offline, mỗi đêm)
- **Serve** kết quả đã tính sẵn qua REST API cho BE Spring Boot

```
SmartF&B System
│
├── FE React (port 5173)
│     └── → gọi BE qua /api
│
├── BE Spring Boot (port 8080)
│     ├── → đọc kết quả dự báo từ bảng forecast_results (DB chung)
│     └── → (tùy chọn) gọi /api/v1/train để trigger train thủ công
│
└── AI Service Python (port 8001) ← file này mô tả service này
      ├── Đọc data từ DB của BE (schema chung)
      ├── Train NeuralProphet → lưu .np vào storage/models/
      ├── Predict → ghi vào bảng forecast_results
      └── Serve /api/v1/forecast/{branch_id} (chỉ đọc DB, không chạy model)
```

---

## 2. Cấu trúc thư mục chi tiết

```
ai-service/
├── app/
│   ├── main.py                          # FastAPI app, mount routers, middleware
│   │
│   ├── core/
│   │   ├── config.py                    # Pydantic BaseSettings — đọc từ .env
│   │   ├── database.py                  # SQLAlchemy async engine + get_db()
│   │   ├── security.py                  # Verify JWT token của Spring Boot
│   │   └── logging.py                   # Cấu hình structlog / logging
│   │
│   ├── api/
│   │   ├── deps.py                      # Shared deps: get_db, get_current_tenant
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── forecast.py              # GET /api/v1/forecast/{branch_id}
│   │       ├── train.py                 # POST /api/v1/train/trigger (thủ công)
│   │       └── health.py               # GET /health
│   │
│   ├── models/                          # SQLAlchemy ORM models
│   │   ├── forecast_result.py           # Bảng forecast_results
│   │   └── train_log.py                 # Bảng train_logs
│   │
│   ├── schemas/                         # Pydantic request/response schemas
│   │   ├── forecast.py                  # ForecastResponse, IngredientForecast
│   │   └── train.py                     # TrainRequest, TrainStatusResponse
│   │
│   ├── services/
│   │   ├── data_service.py              # Đọc data từ DB: đơn hàng, recipe, tồn kho
│   │   ├── train_service.py             # Logic train Global Model
│   │   ├── predict_service.py           # Logic predict + ghi kết quả
│   │   ├── weather_service.py           # Gọi Open-Meteo API, lưu cache vào DB
│   │   └── event_service.py             # Quản lý sự kiện (khai trương, khuyến mãi)
│   │
│   ├── scheduler/
│   │   ├── jobs.py                      # Định nghĩa cron jobs
│   │   └── runner.py                    # Khởi động APScheduler
│   │
│   └── utils/
│       ├── model_io.py                  # save_model(), load_model(), list_models()
│       ├── stock_calculator.py          # predict_stockout_date(), calc_order_qty()
│       └── dataframe_builder.py         # Build DataFrame chuẩn NeuralProphet từ raw data
│
├── storage/
│   └── models/                          # Model files (.np) — gitignored
│       └── {tenant_id}/
│           ├── global_model.np          # Global Model cho toàn tenant
│           └── train_metadata.json      # Thời gian train, số series, metrics
│
├── tests/
│   ├── conftest.py                      # Fixtures: db session, sample dataframes
│   ├── test_data_service.py
│   ├── test_train_service.py
│   ├── test_predict_service.py
│   └── test_stock_calculator.py
│
├── docs/
│   ├── plans/                           # Feature plans theo ngày
│   │   └── current-sprint.md
│   ├── architecture/
│   │   ├── ai-service-structure.md      # File này
│   │   ├── data-flow.md                 # Luồng dữ liệu chi tiết
│   │   └── api-endpoints.md             # Danh sách endpoints đã implement
│   ├── skills/
│   │   ├── vibe-coding-services.md      # Quick-start khi implement service mới
│   │   ├── engineering-decisions.md     # Template quyết định kỹ thuật
│   │   └── model-evaluation.md         # Hướng dẫn đánh giá model accuracy
│   └── dev-notes/                       # Bug reports, notes
│
├── .env.example
├── .env                                 # Gitignored
├── requirements.txt
├── Dockerfile
├── CLAUDE.md
└── init.md
```

---

## 3. Database Schema (dùng chung với BE)

AI Service chỉ **đọc** các bảng của BE, và **ghi** vào các bảng của AI:

### Bảng BE đọc (read-only)
```sql
-- Lịch sử đơn hàng
order_details (order_id, menu_item_id, quantity, created_at)
orders (id, branch_id, tenant_id, status, created_at)

-- Recipe để quy đổi món → nguyên liệu
recipes (menu_item_id, ingredient_id, quantity, unit)

-- Nguyên liệu
ingredients (id, tenant_id, name, unit, current_stock)

-- Chi nhánh (có lat/lng cho thời tiết)
branches (id, tenant_id, name, latitude, longitude)

-- Sự kiện khai báo bởi chủ quán
branch_events (id, branch_id, event_type, start_date, end_date)
```

### Bảng AI ghi (write)
```sql
-- Kết quả dự báo (BE đọc để serve lên FE)
CREATE TABLE forecast_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       VARCHAR NOT NULL,
    branch_id       VARCHAR NOT NULL,
    ingredient_id   VARCHAR NOT NULL,
    forecast_date   DATE NOT NULL,           -- Ngày được dự báo
    predicted_qty   FLOAT NOT NULL,          -- Tiêu thụ dự kiến ngày đó
    stockout_date   DATE,                    -- Ngày hết hàng dự kiến
    suggested_qty   FLOAT,                   -- Số lượng gợi ý nhập
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE (branch_id, ingredient_id, forecast_date)
);

-- Log quá trình train
CREATE TABLE train_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       VARCHAR NOT NULL,
    started_at      TIMESTAMP NOT NULL,
    finished_at     TIMESTAMP,
    status          VARCHAR NOT NULL,        -- running | success | failed
    series_count    INT,                     -- Số series đã train
    mae             FLOAT,                   -- Metric MAE cuối cùng
    error_message   TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 4. Environment Variables (.env.example)

```env
# Database (chung với BE)
DATABASE_URL=postgresql+asyncpg://smartfnb:password@localhost:5432/smartfnb_db

# AI Service
AI_SERVICE_PORT=8001
AI_SERVICE_HOST=0.0.0.0

# Security — dùng chung secret với Spring Boot để verify JWT
JWT_SECRET=your_jwt_secret_here
JWT_ALGORITHM=HS256

# Storage
MODEL_STORAGE_DIR=./storage/models

# Scheduler
TRAIN_CRON_HOUR=2
TRAIN_CRON_DAY_OF_WEEK=sun
PREDICT_CRON_HOUR=0
PREDICT_CRON_MINUTE=30

# Weather API (Open-Meteo — miễn phí)
WEATHER_CACHE_DAYS=1

# Logging
LOG_LEVEL=INFO
```

---

## 5. API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/health` | Health check cho Spring Boot ping | Không |
| GET | `/api/v1/forecast/{branch_id}` | Lấy dự báo 7 ngày của chi nhánh | JWT |
| GET | `/api/v1/forecast/{branch_id}/{ingredient_id}` | Dự báo 1 nguyên liệu cụ thể | JWT |
| POST | `/api/v1/train/trigger` | Trigger train thủ công (Owner) | JWT |
| GET | `/api/v1/train/status/{tenant_id}` | Xem trạng thái train gần nhất | JWT |

---

## 6. Scheduler Jobs

| Job | Lịch | Mô tả |
|-----|------|-------|
| `train_all_tenants` | Chủ nhật 2:00 AM | Train Global Model cho tất cả tenant |
| `predict_all_branches` | Hàng đêm 00:30 AM | Predict 7 ngày + tính kho cho tất cả chi nhánh |
| `fetch_weather` | Hàng ngày 6:00 AM | Cập nhật dữ liệu thời tiết cho tất cả chi nhánh |

---

## 7. File nên đọc đầu tiên nếu là AI Agent

```
1. CLAUDE.md                              # Quy tắc code
2. docs/architecture/ai-service-structure.md  # File này
3. docs/architecture/data-flow.md        # Luồng data chi tiết
4. docs/plans/current-sprint.md          # Task đang làm
5. app/core/config.py                    # Settings
6. app/services/                         # Logic chính
```
