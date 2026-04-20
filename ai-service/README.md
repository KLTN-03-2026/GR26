# SmartF&B AI Service

Dịch vụ dự báo tiêu thụ nguyên liệu cho chuỗi F&B — sử dụng **NeuralProphet** (Global Model) kết hợp dữ liệu thời tiết từ **Open-Meteo**.

Chạy song song với Spring Boot BE ở port **8001**. BE gọi AI Service qua HTTP internal.

---

## Kiến trúc

```
React FE (5173)
      │
      ▼
Spring Boot BE (8080) ──────────────────────► AI Service (8001)
      │                                              │
      └──────────────┐                               │
                     ▼                               ▼
              PostgreSQL (5432) ◄──── shared DB ─────┘
```

- **BE** sở hữu bảng: `inventory_transactions`, `inventory_balances`, `items`, `branches`, `tenants`
- **AI Service** sở hữu bảng: `ai_series_registry`, `consumption_history`, `forecast_results`, `train_logs`, `weather_cache`
- Cùng một PostgreSQL instance — AI Service READ bảng của BE, WRITE bảng riêng

---

## Cài đặt local

```bash
# 1. Tạo virtual environment
python -m venv venv && source venv/bin/activate

# 2. Cài packages
pip install -r requirements.txt

# 3. Cấu hình môi trường
cp .env.example .env
# Chỉnh sửa .env: điền DATABASE_URL và JWT_SECRET cho đúng

# 4. Chạy migration tạo bảng AI
alembic upgrade head

# 5. Khởi động server
uvicorn app.main:app --reload --port 8001

# 6. Kiểm tra
curl http://localhost:8001/health
```

---

## API

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/health` | Không | Health check — DB, scheduler, models |
| GET | `/api/v1/forecast/{branch_id}` | Bearer | Dự báo 7 ngày cho chi nhánh |
| GET | `/api/v1/forecast/{branch_id}/summary` | Bearer | Tóm tắt urgent/warning count |
| GET | `/api/v1/forecast/{branch_id}/{ingredient_id}` | Bearer | Dự báo 1 nguyên liệu |
| POST | `/api/v1/train/trigger` | Bearer (OWNER) | Trigger train thủ công |
| GET | `/api/v1/train/status` | Bearer | Trạng thái train gần nhất |

Swagger UI: `http://localhost:8001/docs`

---

## Cron Jobs

| Job | Lịch | Mô tả |
|-----|------|-------|
| `train_all_tenants` | Chủ nhật 02:00 | Train NeuralProphet Global Model |
| `predict_all_branches` | Hàng ngày 00:30 | Predict 7 ngày + ghi `forecast_results` |
| `fetch_weather_all` | Hàng ngày 06:00 | Cập nhật thời tiết từ Open-Meteo |

---

## Docker

```bash
# Build image
docker build -t smartfnb-ai .

# Chạy standalone (cần DB đang chạy)
docker run -p 8001:8001 --env-file .env smartfnb-ai

# Tích hợp với docker-compose của BE
docker-compose -f docker-compose.yml -f ai-service/docker-compose.ai.yml up
```

---

## Cấu trúc thư mục

```
ai-service/
├── app/
│   ├── api/v1/         # Forecast + Train + Health endpoints
│   ├── core/           # Config, DB, Security, Logging
│   ├── models/         # SQLAlchemy ORM models
│   ├── repositories/   # SeriesRegistryRepo
│   ├── scheduler/      # APScheduler jobs + runner
│   ├── schemas/        # Pydantic request/response schemas
│   ├── services/       # data, train, predict, weather
│   └── utils/          # model_io, stock_calculator, dataframe_builder
├── alembic/            # DB migrations
├── storage/models/     # Trained .np model files (gitignored)
├── scripts/            # e2e_test.py
└── tests/              # Unit tests (149 tests)
```

---

## Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| Model không tồn tại | Chưa chạy train job | Gọi `POST /api/v1/train/trigger` hoặc đợi cron Chủ nhật |
| Predict dùng fallback | Model bị lỗi hoặc chưa có | Xem logs — fallback = average 7 ngày |
| DB connection lỗi | Sai `DATABASE_URL` | Kiểm tra `.env` và PostgreSQL đang chạy |
| JWT 401 | Secret không khớp | Đảm bảo `JWT_SECRET` = `jwt.secret` trong Spring Boot |
| `jwt_secret='changeme'` error | Quên đổi secret | Đặt `JWT_SECRET` trong `.env` (production) |
| Scheduler không chạy | App chưa startup xong | Kiểm tra `/health` → `"scheduler": "running"` |
