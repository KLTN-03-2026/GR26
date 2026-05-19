# SmartF&B AI Service — Prompt từng Session

> Copy toàn bộ block `prompt` của session tương ứng và paste vào Claude Code.
> Mỗi session làm 1 nhóm task, xác nhận xong rồi mới sang session tiếp theo.

---

## Trạng thái tổng quan

| Session | Nhóm task | Bước | Trạng thái |
|---------|-----------|------|-----------|
| Session 1 | Skeleton + DB + data_service | Bước 0–1 | ✅ Xong |
| Session 2 | train_service | Bước 2 | ✅ Xong |
| Session 3 | dataframe_builder + stock_calculator + predict_service | Bước 3 | ✅ Xong |
| **Session 4** | **model_io (hoàn thiện) + Schemas** | **Bước 4–5** | ⬜ Chờ |
| **Session 5** | **Security + API Forecast + API Train** | **Bước 6–8** | ⬜ Chờ |
| **Session 6** | **Scheduler + Weather Service** | **Bước 9–10** | ⬜ Chờ |
| **Session 7** | **E2E Test + Hardening** | **Bước 11+14** | ⬜ Chờ |
| **Session 8** | **Docker + README** | **Bước 15** | ⬜ Chờ |
| Session 9 | Spring Boot integration | Bước 12 | ⬜ Chờ (BE project) |
| Session 10 | React Frontend | Bước 13 | ⬜ Chờ (FE project) |

---
---

## SESSION 4 — model_io (hoàn thiện) + Schemas

```
Đọc tuần tự:
1. ai-service/CLAUDE.md
2. ai-service/app/utils/model_io.py          (xem đã implement những gì)
3. ai-service/app/schemas/forecast.py        (xem đã có gì)
4. ai-service/app/schemas/train.py           (xem đã có gì)

Chạy: find ai-service/app -type f -name "*.py" | sort

════════════════════════════════════════════
TASK A: Hoàn thiện app/utils/model_io.py
════════════════════════════════════════════

Viết plan tại docs/plans/{hôm nay}/04-model-io.md

Đọc kỹ file hiện tại. Kiểm tra đã có chưa, thiếu thì thêm:

1. save_model(model, tenant_id: str, series_count: int = 0) -> Path
   - Lưu vào: storage/models/{tenant_id}/global_model.np
   - Dùng neuralprophet.save() — TUYỆT ĐỐI KHÔNG dùng pickle
   - Tự tạo folder nếu chưa có (mkdir parents=True)
   - Sau khi save model, ghi kèm train_metadata.json cạnh file .np:
     {
       "trained_at": "<ISO datetime UTC>",
       "tenant_id": "...",
       "series_count": N,
       "model_path": "storage/models/{tenant_id}/global_model.np"
     }
   - Return Path của file .np đã lưu

2. load_model(tenant_id: str) -> object | None
   - Load từ storage/models/{tenant_id}/global_model.np
   - Return None nếu file KHÔNG tồn tại (không raise)
   - Nếu file tồn tại nhưng load bị exception (corrupt):
       → log error rõ lý do
       → xóa file .np + metadata.json
       → return None
   - Khi return None: predict_service sẽ dùng fallback

3. model_exists(tenant_id: str) -> bool
   - Kiểm tra file .np tồn tại (không load)

4. get_train_metadata(tenant_id: str) -> dict | None
   - Đọc train_metadata.json
   - Return None nếu chưa có file
   - Return None nếu JSON parse lỗi (log warning)

5. list_all_models() -> list[str]
   - Liệt kê tất cả tenant_id đã có model file .np
   - Scan folder storage/models/ → tên subfolder
   - Return [] nếu storage chưa có gì

Yêu cầu:
- Docstring tiếng Việt cho mọi function public
- tests/test_model_io.py:
  • test save_model tạo file .np và metadata.json
  • test load_model file không tồn tại → None
  • test load_model file corrupt → None + file bị xóa
  • test model_exists True/False
  • test get_train_metadata có và không có file
  • test list_all_models
  (Dùng tmp_path fixture của pytest, patch settings.model_storage_dir)

Xác nhận tôi trước khi làm TASK B.

════════════════════════════════════════════
TASK B: Hoàn thiện app/schemas/forecast.py + train.py
════════════════════════════════════════════

Viết plan tại docs/plans/{hôm nay}/05-schemas.md

Đọc kỹ cả 2 file schemas hiện tại. Chỉ thêm/sửa những gì còn thiếu.

--- app/schemas/forecast.py ---

Đảm bảo có đầy đủ:

class DayForecast(BaseModel):
    forecast_date: date
    predicted_qty: float

class IngredientForecast(BaseModel):
    ingredient_id: str
    ingredient_name: str
    unit: str
    current_stock: float
    forecast_days: list[DayForecast]        # 7 ngày tới
    stockout_date: date | None              # None = đủ hàng trong 7 ngày
    suggested_order_qty: float
    suggested_order_date: date
    urgency: Literal["ok", "warning", "critical"]
    is_fallback: bool                       # True = dùng average, chưa có model

class ForecastResponse(BaseModel):
    branch_id: str
    branch_name: str
    generated_at: datetime
    last_trained_at: datetime | None        # Từ train_metadata.json
    ingredients: list[IngredientForecast]

    @property
    def urgent_count(self) -> int:
        """Số nguyên liệu cần nhập ngay (critical)."""
        return sum(1 for i in self.ingredients if i.urgency == "critical")

    @property
    def warning_count(self) -> int:
        """Số nguyên liệu sắp hết (warning)."""
        return sum(1 for i in self.ingredients if i.urgency == "warning")

class ForecastSummary(BaseModel):
    """Response nhẹ cho dashboard overview — không có forecast_days chi tiết."""
    branch_id: str
    generated_at: datetime
    urgent_count: int
    warning_count: int
    ok_count: int
    total_ingredients: int

--- app/schemas/train.py ---

Đảm bảo có đầy đủ:

class TrainRequest(BaseModel):
    tenant_id: str | None = None     # None = dùng tenant từ JWT token

class TrainResult(BaseModel):
    tenant_id: str
    status: Literal["success", "skipped", "failed"]
    series_count: int
    mae: float | None
    duration_seconds: float
    model_path: str | None
    error: str | None = None

class TrainStatusResponse(BaseModel):
    tenant_id: str
    last_trained_at: datetime | None
    status: str | None               # success | failed | running | None
    series_count: int | None
    mae: float | None
    model_exists: bool

Yêu cầu:
- Tất cả class có model_config = ConfigDict(from_attributes=True)
- Docstring tiếng Việt ngắn cho mỗi class
- KHÔNG cần test riêng cho schemas (Pydantic tự validate)

Xác nhận tôi sau khi hoàn thành toàn bộ Session 4.
```

---
---

## SESSION 5 — Security + API Forecast + API Train

```
Đọc tuần tự:
1. ai-service/CLAUDE.md phần 4 (MULTI-TENANT) và phần 9 (KHÔNG LÀM)
2. ai-service/app/core/security.py           (xem đã implement gì)
3. ai-service/app/api/deps.py                (xem đã có gì)
4. ai-service/app/api/v1/forecast.py         (xem stub hiện tại)
5. ai-service/app/api/v1/train.py            (xem stub hiện tại)
6. ai-service/app/schemas/forecast.py        (cần biết ForecastResponse shape)
7. ai-service/app/schemas/train.py           (cần biết TrainStatusResponse shape)
8. ai-service/app/models/forecast_result.py  (schema DB)
9. ai-service/app/models/series_registry.py  (join với AiSeriesRegistry)

════════════════════════════════════════════
TASK A: app/core/security.py + app/api/deps.py
════════════════════════════════════════════

Viết plan tại docs/plans/{hôm nay}/06-security.md

--- app/core/security.py ---

Đọc kỹ file hiện tại. Thêm/sửa để đảm bảo:

1. @dataclass TokenPayload:
   sub: str           # userId
   tenant_id: str     # UUID tenant
   branch_id: str | None = None
   role: str = ""
   permissions: list[str] = field(default_factory=list)

2. verify_token(token: str) -> TokenPayload
   - Decode JWT dùng jose.jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
   - Raise HTTPException(401, "Token không hợp lệ hoặc đã hết hạn") nếu JWTError
   - Map payload → TokenPayload:
     tenant_id từ payload["tenantId"] hoặc payload["tenant_id"]
     Raise HTTPException(403, "Token thiếu tenant_id") nếu không có
   - Return TokenPayload

--- app/api/deps.py ---

Đọc kỹ file hiện tại. Đảm bảo có:

1. get_db() -> AsyncGenerator[AsyncSession, None]
   async with SessionLocal() as session: yield session

2. get_current_tenant(token: str | None = Depends(oauth2_scheme)) -> TokenPayload
   - Nếu token None → HTTPException(401, "Thiếu Authorization header")
   - Gọi security.verify_token(token) → return TokenPayload

3. verify_branch_access(branch_id: str, tenant: TokenPayload = Depends(get_current_tenant), db = Depends(get_db)) -> str
   - Kiểm tra branch thuộc tenant — tránh tenant A đọc data tenant B:
     SELECT 1 FROM branches WHERE id=:branch_id AND tenant_id=:tenant_id
   - Raise HTTPException(403, "Branch không thuộc tenant của bạn") nếu không tìm thấy
   - Return branch_id

Yêu cầu:
- tests/test_security.py:
  • test token hợp lệ → TokenPayload đúng
  • test token expired → HTTPException 401
  • test token không có tenant_id → HTTPException 403
  • test token sai secret → HTTPException 401
  (Mock jose.jwt.decode để không cần JWT thật)

Xác nhận tôi trước khi làm TASK B.

════════════════════════════════════════════
TASK B: app/api/v1/forecast.py
════════════════════════════════════════════

Viết plan tại docs/plans/{hôm nay}/07-forecast-api.md

Implement 3 endpoints — TẤT CẢ chỉ đọc DB, KHÔNG chạy model:

1. GET /api/v1/forecast/{branch_id}
   - Dependency: verify_branch_access (tự check branch thuộc tenant)
   - Query forecast_results JOIN ai_series_registry JOIN items (ingredient name, unit)
     WHERE ai_series_registry.branch_id = :branch_id
       AND forecast_results.forecast_date >= TODAY
     ORDER BY forecast_date ASC
   - Gọi model_io.get_train_metadata(tenant_id) → lấy last_trained_at
   - Group kết quả theo ingredient, map sang list[IngredientForecast]
     Mỗi ingredient có forecast_days = list DayForecast 7 ngày
   - Nếu không có rows: trả ForecastResponse với ingredients=[], message về
   - Header: Cache-Control: max-age=300
   - Log thời gian xử lý: logger.info("forecast %s: %.0fms", branch_id, ms)
   - Return ForecastResponse

2. GET /api/v1/forecast/{branch_id}/summary
   - Chỉ đọc: COUNT urgency từ forecast_results cho hôm nay
   - Return ForecastSummary (không có forecast_days chi tiết — load nhanh)

3. GET /api/v1/forecast/{branch_id}/{ingredient_id}
   - Filter thêm ingredient_id cụ thể
   - Return IngredientForecast 1 nguyên liệu duy nhất
   - 404 nếu không tìm thấy ingredient trong forecast

Quy tắc QUAN TRỌNG:
- Response time PHẢI < 200ms — chỉ đọc từ bảng forecast_results đã có sẵn
- Trường hợp forecast_results rỗng: return 200 kèm message "Dữ liệu đang được chuẩn bị"
  KHÔNG trả 404, KHÔNG trả 500
- Mount router vào app/main.py

Xác nhận tôi trước khi làm TASK C.

════════════════════════════════════════════
TASK C: app/api/v1/train.py
════════════════════════════════════════════

Viết plan tại docs/plans/{hôm nay}/08-train-api.md

1. POST /api/v1/train/trigger
   - Chỉ role OWNER hoặc ADMIN mới được gọi
     (Kiểm tra tenant.role trong TokenPayload từ Depends(get_current_tenant))
   - Body: TrainRequest (tenant_id optional)
     Nếu tenant_id=None → dùng tenant_id từ JWT token
   - Chạy train trong BackgroundTasks — KHÔNG block request:
     background_tasks.add_task(run_train_background, tenant_id)
   - Return NGAY: TrainTriggerResponse(
       message="Train job đã được khởi động",
       tenant_id=tenant_id,
       status="queued"
     )

2. GET /api/v1/train/status
   - Đọc TrainLog mới nhất của tenant từ JWT
   - Return TrainStatusResponse
   - Thêm model_exists: bool từ model_io.model_exists(tenant_id)

3. Background task wrapper (trong file train.py):
   async def run_train_background(tenant_id: str) -> None:
       async with SessionLocal() as db:
           try:
               await train_service.run_train_for_tenant(db, tenant_id, trigger_type="manual")
           except Exception as exc:
               logger.error("Background train thất bại: tenant=%s | %s", tenant_id, exc)

Mount router vào app/main.py.
Xác nhận tôi sau khi hoàn thành toàn bộ Session 5.
```

---
---

## SESSION 6 — Scheduler + Weather Service

```
Đọc tuần tự:
1. ai-service/CLAUDE.md phần 6 (TRAIN/PREDICT) và phần 7 (THỜI TIẾT)
2. ai-service/app/scheduler/runner.py    (xem đã implement gì)
3. ai-service/app/scheduler/jobs.py      (xem đã implement gì)
4. ai-service/app/core/config.py         (kiểm tra cron config settings)
5. ai-service/app/main.py               (kiểm tra lifespan/startup đã mount chưa)

════════════════════════════════════════════
TASK A: Hoàn thiện app/scheduler/
════════════════════════════════════════════

Viết plan tại docs/plans/{hôm nay}/09-scheduler.md

--- app/scheduler/jobs.py ---

Đọc file hiện tại. Đảm bảo 3 job functions đều wrap trong try/except:

1. async def train_all_tenants():
   start = time.monotonic()
   try:
       logger.info("=== JOB TRAIN BẮT ĐẦU ===")
       async with SessionLocal() as db:
           results = await train_service.run_train_all_tenants(db)
       success = sum(1 for r in results if r["status"] == "success")
       duration = time.monotonic() - start
       logger.info("=== JOB TRAIN XONG: %d/%d tenant | %.1fs ===", success, len(results), duration)
   except Exception as exc:
       logger.error("JOB TRAIN THẤT BẠI sau %.1fs: %s", time.monotonic()-start, exc)
       # KHÔNG re-raise — scheduler tiếp tục chạy

2. async def predict_all_branches():
   - Cấu trúc tương tự train_all_tenants
   - Gọi predict_service.predict_all_branches(db)
   - Log: "=== JOB PREDICT BẮT ĐẦU ===" và "=== JOB PREDICT XONG: %.1fs ==="

3. async def fetch_weather_all():
   - Placeholder nếu weather_service chưa có: log info + return
   - Nếu weather_service đã có: gọi weather_service.fetch_all_branches_weather(db)
   - Wrap try/except tương tự

--- app/scheduler/runner.py ---

Đọc file hiện tại. Đảm bảo start_scheduler() đăng ký đủ 3 jobs:

scheduler.add_job(
    train_all_tenants,
    CronTrigger(day_of_week=settings.train_cron_day_of_week,
                hour=settings.train_cron_hour,
                timezone="Asia/Ho_Chi_Minh"),
    id="job_train_all",
    replace_existing=True,
    misfire_grace_time=3600,  # Cho phép chạy muộn 1h nếu server restart
)
scheduler.add_job(
    predict_all_branches,
    CronTrigger(hour=settings.predict_cron_hour,
                minute=settings.predict_cron_minute,
                timezone="Asia/Ho_Chi_Minh"),
    id="job_predict_all",
    replace_existing=True,
    misfire_grace_time=1800,
)
scheduler.add_job(
    fetch_weather_all,
    CronTrigger(hour=settings.weather_cron_hour, minute=0,
                timezone="Asia/Ho_Chi_Minh"),
    id="job_fetch_weather",
    replace_existing=True,
)

--- app/main.py ---

Kiểm tra đã có lifespan hoặc startup/shutdown events chưa.
Nếu chưa, thêm:

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(..., lifespan=lifespan)

Xác nhận tôi trước khi làm TASK B.

════════════════════════════════════════════
TASK B: app/services/weather_service.py
════════════════════════════════════════════

Viết plan tại docs/plans/{hôm nay}/10-weather-service.md

Bước 1 — Tạo Alembic migration nếu bảng weather_cache chưa có:
   File: alembic/versions/002_add_weather_cache.py
   CREATE TABLE weather_cache (
       id            SERIAL PRIMARY KEY,
       branch_id     VARCHAR NOT NULL,
       date          DATE NOT NULL,
       temperature   FLOAT,       -- °C max trong ngày
       precipitation FLOAT,       -- mm lượng mưa
       cached_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       UNIQUE (branch_id, date)
   );

Bước 2 — Implement app/services/weather_service.py:

1. async def fetch_weather_for_branch(branch_id: str, db: AsyncSession) -> bool
   - Gọi data_service.get_branch_coordinates(db, branch_id) → (lat, lng) | None
   - Nếu không có tọa độ: logger.warning(...), return False
   - Kiểm tra cache: SELECT 1 FROM weather_cache WHERE branch_id=? AND date=TODAY
     Nếu đã có → return True (skip)
   - Gọi Open-Meteo API (dùng httpx.AsyncClient):
     GET https://api.open-meteo.com/v1/forecast
     params:
       latitude={lat}, longitude={lng}
       daily=temperature_2m_max,precipitation_sum
       timezone=Asia/Ho_Chi_Minh
       forecast_days=8
   - Parse response["daily"]:
       dates = response["daily"]["time"]
       temps = response["daily"]["temperature_2m_max"]
       precip = response["daily"]["precipitation_sum"]
   - UPSERT vào weather_cache cho mỗi ngày:
     INSERT ... ON CONFLICT (branch_id, date) DO UPDATE SET temperature=..., precipitation=...
   - Nếu httpx exception: logger.warning(...), return False — KHÔNG raise
   - Return True nếu thành công

2. async def get_weather_df(branch_id: str, dates: list[date], db: AsyncSession) -> pd.DataFrame | None
   - SELECT date, temperature, precipitation FROM weather_cache
     WHERE branch_id=? AND date = ANY(:dates)
   - Return DataFrame: ds (datetime64), temperature (float), precipitation (float)
   - Return None nếu không có data

3. async def fetch_all_branches_weather(db: AsyncSession) -> None
   - Lấy tất cả branch có tọa độ (lat IS NOT NULL AND lng IS NOT NULL)
   - Loop: await fetch_weather_for_branch(branch_id, db)
   - Log: "Đã cập nhật thời tiết cho X/Y chi nhánh"

Quy tắc QUAN TRỌNG:
- Weather là OPTIONAL — nếu API lỗi thì train/predict vẫn chạy bình thường
- Thêm httpx vào requirements.txt nếu chưa có
- Timeout httpx: 10 giây

Cập nhật jobs.py để gọi weather_service.fetch_all_branches_weather(db) thay cho placeholder.

Xác nhận tôi sau khi hoàn thành toàn bộ Session 6.
```

---
---

## SESSION 7 — E2E Test + Hardening

```
Đọc tuần tự:
1. ai-service/CLAUDE.md phần 9 (KHÔNG LÀM) và phần 10 (CHECKLIST)
2. ai-service/app/ (lướt nhanh toàn bộ — tìm print(), TODO, raise NotImplementedError)
3. ai-service/app/core/database.py   (kiểm tra pool config)
4. ai-service/app/api/v1/health.py   (xem health check hiện tại)

════════════════════════════════════════════
TASK A: Hardening
════════════════════════════════════════════

Viết plan tại docs/plans/{hôm nay}/14-hardening.md

Kiểm tra và sửa lần lượt:

1. Xóa tất cả print() debug:
   grep -rn "print(" app/ → sửa thành logger.debug() hoặc xóa

2. DB connection pool (app/core/database.py):
   create_async_engine(...,
       pool_size=5,
       max_overflow=10,
       pool_timeout=30,
       pool_recycle=1800,   # Recycle sau 30 phút tránh "connection closed"
   )

3. Config validation (app/core/config.py):
   Thêm @model_validator(mode="after") trong class Settings:
   - Raise ValueError nếu jwt_secret == "changeme" và môi trường != dev/test
   - Log warning nếu database_url chứa "localhost" (gợi ý đang dùng default)

4. Health check chi tiết (app/api/v1/health.py):
   GET /health trả về:
   {
     "status": "ok",
     "service": "smartfnb-ai",
     "db": "connected" | "error: <reason>",
     "scheduler": "running" | "stopped",
     "models_loaded": N   // đếm folder trong storage/models/
   }
   - Test DB: SELECT 1 với timeout 2 giây
   - Không để health check crash app nếu DB down → bắt exception, trả "error"

5. Tenant mới / series ít data (app/services/train_service.py):
   - Nếu TẤT CẢ series của tenant đều không đủ ngày → status="skipped"
   - Log rõ từng series bị skip: "Skip s{id}: chỉ {n} ngày"

6. Kiểm tra security multi-tenant trong API:
   - Đảm bảo mọi query trong forecast.py đều có tenant_id filter
   - grep -n "forecast_results" app/api/ → review từng query

════════════════════════════════════════════
TASK B: Script test end-to-end
════════════════════════════════════════════

Tạo scripts/e2e_test.py — script chạy thủ công để kiểm tra toàn bộ luồng:

import asyncio
from app.core.database import SessionLocal
from app.services import data_service, train_service, predict_service

TENANT_ID = "test-tenant-uuid"
BRANCH_ID = "test-branch-uuid"

async def main():
    print("=== SmartF&B AI E2E Test ===")
    async with SessionLocal() as db:

        # 1. Kiểm tra data_service
        tenants = await data_service.get_all_active_tenants(db)
        print(f"✓ Active tenants: {len(tenants)}")

        # 2. Test train (bỏ qua nếu không có data)
        if tenants:
            result = await train_service.run_train_for_tenant(db, tenants[0])
            print(f"✓ Train: {result['status']} | MAE={result.get('mae')}")

        # 3. Test predict
        await predict_service.predict_all_branches(db)
        print("✓ Predict hoàn thành")

        # 4. Đếm kết quả
        from sqlalchemy import text
        row = await db.execute(text("SELECT COUNT(*) FROM forecast_results"))
        print(f"✓ Forecast rows: {row.scalar()}")

    print("=== PASSED ===")

if __name__ == "__main__":
    asyncio.run(main())

════════════════════════════════════════════
TASK C: Chạy toàn bộ tests + fix lỗi
════════════════════════════════════════════

Chạy:
   pytest tests/ -v --tb=short 2>&1 | tee test-results.txt

Với mỗi test FAIL:
1. Đọc traceback kỹ
2. Fix root cause trong source code
3. Tạo docs/dev-notes/BUG-{hôm nay}-{số thứ tự}.md:
   - Mô tả lỗi
   - Root cause
   - Cách fix

Kỳ vọng: 100% tests pass trước khi sang Session 8.

Xác nhận tôi sau khi hoàn thành Session 7.
```

---
---

## SESSION 8 — Docker + README

```
Đọc tuần tự:
1. ai-service/CLAUDE.md
2. ai-service/requirements.txt
3. ai-service/app/main.py (port, host config)
4. Kiểm tra .env.example đã có đủ chưa

════════════════════════════════════════════
TASK A: Dockerfile
════════════════════════════════════════════

Tạo/cập nhật ai-service/Dockerfile:

FROM python:3.11-slim

WORKDIR /app

# Layer cache: install deps trước khi copy source
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Tạo folder storage (persist qua volume mount)
RUN mkdir -p storage/models

EXPOSE 8001

# Single worker — NeuralProphet không thread-safe với multi-worker
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]

════════════════════════════════════════════
TASK B: .dockerignore
════════════════════════════════════════════

Tạo ai-service/.dockerignore:
__pycache__/
*.pyc
*.pyo
.env
.env.*
!.env.example
venv/
.venv/
storage/models/
tests/
docs/
*.md
!README.md
.git/
.gitignore
scripts/

════════════════════════════════════════════
TASK C: docker-compose snippet
════════════════════════════════════════════

Tạo ai-service/docker-compose.ai.yml (standalone, để merge với docker-compose chính):

version: "3.9"
services:
  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    container_name: smartfnb-ai
    ports:
      - "8001:8001"
    env_file:
      - ./ai-service/.env
    volumes:
      - ai_models:/app/storage/models
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - internal
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  ai_models:

════════════════════════════════════════════
TASK D: .env.example (kiểm tra đầy đủ)
════════════════════════════════════════════

Đảm bảo ai-service/.env.example có đủ:

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/smartfnb_db

# Service
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_PORT=8001
LOG_LEVEL=INFO

# JWT (phải khớp với Spring Boot)
JWT_SECRET=change-me-to-match-spring-boot-secret
JWT_ALGORITHM=HS256

# Model storage
MODEL_STORAGE_DIR=./storage/models

# NeuralProphet
NP_N_LAGS=14
NP_N_FORECASTS=7
NP_EPOCHS=100

# Scheduler cron (Asia/Ho_Chi_Minh)
TRAIN_CRON_HOUR=2
TRAIN_CRON_DAY_OF_WEEK=sun
PREDICT_CRON_HOUR=0
PREDICT_CRON_MINUTE=30
WEATHER_CRON_HOUR=6

# Optional alerts
ALERT_WEBHOOK_URL=

════════════════════════════════════════════
TASK E: README.md
════════════════════════════════════════════

Tạo ai-service/README.md với các mục:

# SmartF&B AI Service

## Tổng quan
[Mô tả ngắn: dự báo tiêu thụ nguyên liệu, port 8001, chạy cùng Spring Boot]

## Kiến trúc
[Sơ đồ: Spring Boot → AI Service → PostgreSQL (shared DB)]

## Cài đặt local
1. Tạo venv: python -m venv venv && source venv/bin/activate
2. Cài packages: pip install -r requirements.txt
3. Copy config: cp .env.example .env → điền DATABASE_URL và JWT_SECRET
4. Chạy migration: alembic upgrade head
5. Khởi động: uvicorn app.main:app --reload --port 8001
6. Kiểm tra: curl http://localhost:8001/health

## API chính
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /health | Health check |
| GET | /api/v1/forecast/{branch_id} | Dự báo 7 ngày cho chi nhánh |
| GET | /api/v1/forecast/{branch_id}/summary | Tóm tắt (urgent/warning count) |
| POST | /api/v1/train/trigger | Trigger train thủ công (OWNER only) |
| GET | /api/v1/train/status | Trạng thái train gần nhất |

## Cron Jobs
| Job | Lịch | Mô tả |
|-----|------|-------|
| train_all_tenants | Chủ nhật 02:00 | Train NeuralProphet Global Model |
| predict_all_branches | Hàng ngày 00:30 | Predict 7 ngày + ghi forecast_results |
| fetch_weather_all | Hàng ngày 06:00 | Cập nhật dữ liệu thời tiết từ Open-Meteo |

## Troubleshooting
- Model không tồn tại: predict dùng fallback (average 7 ngày gần nhất)
- DB connection lỗi: kiểm tra DATABASE_URL trong .env
- JWT lỗi: đảm bảo JWT_SECRET khớp với Spring Boot application.properties

════════════════════════════════════════════
TASK F: Final checklist
════════════════════════════════════════════

Chạy lần lượt và báo kết quả:

1. grep -rn "print(" app/                     → phải ra 0 kết quả
2. grep -rn "raise NotImplementedError" app/  → phải ra 0 kết quả
3. pytest tests/ -v --tb=short               → tất cả pass
4. python -c "from app.main import app; print('Import OK')"
5. docker build -t smartfnb-ai . 2>&1 | tail -5  → "Successfully built"

Xác nhận tôi sau khi hoàn thành Session 8.
```

---
---

## SESSION 9 — Spring Boot Integration *(BE project)*

> ⚠️ Session này làm trong thư mục Spring Boot, không phải ai-service.
> Nếu phát hiện lỗi từ phía AI, tạo report: `ai-service/docs/dev-notes/BUG-{date}-be-integration.md`

```
Project: Spring Boot (smartfnb-backend)

Task: Tích hợp AI Service vào Spring Boot

═══════════════════════
File 1: AIServiceClient.java
═══════════════════════

@Service
public class AIServiceClient {

    @Value("${ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate;

    public AIServiceClient() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    public ForecastResponseDTO getForecast(String branchId, String jwtToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(jwtToken);
            return restTemplate.exchange(
                aiServiceUrl + "/api/v1/forecast/" + branchId,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                ForecastResponseDTO.class
            ).getBody();
        } catch (Exception e) {
            log.error("AI service không khả dụng: {}", e.getMessage());
            return ForecastResponseDTO.empty(branchId);  // Fallback rỗng
        }
    }

    public void triggerTrain(String tenantId, String jwtToken) {
        try {
            // POST /api/v1/train/trigger
        } catch (Exception e) {
            log.warn("Không thể trigger AI train: {}", e.getMessage());
        }
    }
}

═══════════════════════
File 2: ForecastResponseDTO.java + IngredientForecastDTO.java
═══════════════════════
Tạo DTO tương ứng với Python ForecastResponse schema.
Dùng @JsonProperty cho camelCase ↔ snake_case mapping.
Thêm static ForecastResponseDTO.empty(branchId) cho fallback.

═══════════════════════
File 3: InventoryForecastController.java
═══════════════════════
@GetMapping("/api/inventory/forecast/{branchId}")
public ResponseEntity<ForecastResponseDTO> getForecast(
    @PathVariable String branchId,
    HttpServletRequest request
) {
    String token = extractBearerToken(request);
    return ResponseEntity.ok(aiServiceClient.getForecast(branchId, token));
}

═══════════════════════
application.properties
═══════════════════════
ai.service.url=http://localhost:8001
ai.service.timeout=5000

Test: GET /api/inventory/forecast/{branchId} từ Postman với JWT token.
```

---
---

## SESSION 10 — React Frontend *(FE project)*

> ⚠️ Session này làm trong thư mục React (smartfb-frontend).

```
Project: React (smartfb-frontend)

Task: Trang dự báo kho thông minh

═══════════════════════
File 1: src/types/forecast.ts
═══════════════════════

export interface DayForecast {
  forecast_date: string;       // "YYYY-MM-DD"
  predicted_qty: number;
}

export interface IngredientForecast {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  current_stock: number;
  forecast_days: DayForecast[];
  stockout_date: string | null; // "YYYY-MM-DD" hoặc null
  suggested_order_qty: number;
  suggested_order_date: string;
  urgency: "ok" | "warning" | "critical";
  is_fallback: boolean;
}

export interface ForecastResponse {
  branch_id: string;
  branch_name: string;
  generated_at: string;
  last_trained_at: string | null;
  ingredients: IngredientForecast[];
}

═══════════════════════
File 2: src/hooks/useForecast.ts
═══════════════════════

- useForecast(branchId: string):
  Gọi GET /api/inventory/forecast/{branchId} (qua Spring Boot, KHÔNG gọi AI trực tiếp)
  Return { data, isLoading, error, refetch }
  Auto-refetch mỗi 5 phút (dùng React Query hoặc useEffect + setInterval)

═══════════════════════
File 3: src/components/inventory/IngredientAlertCard.tsx
═══════════════════════

Props: ingredient: IngredientForecast
Hiển thị:
- Badge màu urgency: đỏ (critical), vàng (warning), xanh (ok)
- Tên + tồn kho hiện tại
- "Dự kiến hết: DD/MM/YYYY (còn N ngày)" hoặc "Đủ hàng ✓"
- "Gợi ý nhập: X {unit} vào DD/MM"
- Mini BarChart 7 ngày (dùng recharts)
- Nếu is_fallback=true: badge nhỏ "Dự báo tạm thời"

═══════════════════════
File 4: src/pages/inventory/InventoryForecastPage.tsx
═══════════════════════

- Lấy branchId từ route params / context
- Dùng useForecast hook
- Sort: critical → warning → ok
- Summary row: "X cần nhập ngay · Y sắp hết · Z ổn"
- Hiển thị "Cập nhật lúc {generated_at}" — format giờ Việt Nam
- Skeleton loading khi isLoading
- Empty state khi ingredients=[]

Thêm route: /inventory/forecast/:branchId → InventoryForecastPage
Xác nhận sau mỗi file.
```

---
---

## Prompt bắt đầu mỗi session (template)

> Copy block này ở ĐẦU mỗi session để Claude Code biết context:

```
Đọc tuần tự:
1. ai-service/CLAUDE.md
2. ai-service/docs/task/ai-service-completion-guide.md  (xem trạng thái hiện tại)
3. ai-service/docs/task/CLAUDE_CODE_PROMPT.md           (xem prompt session này)

Chạy:
- find ai-service/app -type f -name "*.py" | sort
- pytest ai-service/tests/ --tb=no -q 2>&1 | tail -5

Tóm tắt cho tôi:
- ✅ File nào đã implement đầy đủ
- ⬜ File nào còn là stub/NotImplementedError
- ❌ Test nào đang fail

Sau đó bắt đầu Session [số] theo prompt trong CLAUDE_CODE_PROMPT.md.
```
