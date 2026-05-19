# 🧭 SmartF&B AI Service — Hướng dẫn hoàn thành từng bước

> Đọc file này mỗi khi bắt đầu session mới để biết đang ở đâu và làm gì tiếp theo.
> Cập nhật checkbox ✅ sau mỗi bước hoàn thành.

---

## 📍 Trạng thái hiện tại

```
✅ Bước 0 — Skeleton + DB models + Alembic migration
✅ Bước 1 — data_service.py
✅ Bước 2 — train_service.py
✅ Bước 3 — dataframe_builder.py + stock_calculator.py + predict_service.py
✅ Bước 4 — model_io.py
✅ Bước 5 — ORM models + Pydantic schemas hoàn chỉnh
✅ Bước 6 — security.py + API deps
✅ Bước 7 — API forecast endpoint
✅ Bước 8 — API train endpoint
✅ Bước 9 — Scheduler (APScheduler)
✅ Bước 10 — weather_service.py
✅ Bước 11 — Test end-to-end (149/149 pass)
⬜ Bước 12 — Kết nối Spring Boot
⬜ Bước 13 — Kết nối React FE
✅ Bước 14 — Edge cases + Hardening
⬜ Bước 15 — Dockerfile + docker-compose + README  ← TIẾP THEO
```

---

## 🔁 Prompt bắt đầu session — dùng MỖI NGÀY

```
Đọc tuần tự:
1. ai-service/CLAUDE.md
2. ai-service/docs/plans/current-sprint.md

Chạy:
- find ai-service/app -type f -name "*.py" | sort
- ls ai-service/storage/models/ 2>/dev/null || echo "Chưa có model"

Tóm tắt cho tôi:
- ✅ Đã xong
- 🔄 Đang làm
- ❓ Vướng mắc nếu có

Sau đó bắt đầu task tiếp theo theo hướng dẫn trong file này.
```

---

---

# PHẦN 1 — CORE AI LOGIC

---

## ✅ Bước 0 — Skeleton + DB

**Đã hoàn thành.** Bao gồm:
- Cấu trúc thư mục đầy đủ
- `app/core/config.py`, `database.py`
- `app/models/`: series_registry, consumption_history, forecast_result, model_registry, train_log
- `alembic/` + migration `001_init_ai_tables.py`
- `app/repositories/series_registry_repo.py`

---

## ✅ Bước 1 — `data_service.py`

**Đã hoàn thành.** Các hàm:
- `get_all_consumption_for_tenant()`
- `get_recent_consumption()`
- `get_current_stock()`
- `get_active_ingredients()`
- `get_active_tenants()`
- `get_branch_coordinates()`

---

## ✅ Bước 2 — `train_service.py`

**Đã hoàn thành.** Các hàm:
- `validate_training_data()`
- `train_tenant()`
- `train_all_tenants()`
- `get_latest_train_status()`

---

## 🔄 Bước 3 — `dataframe_builder.py` + `stock_calculator.py` + `predict_service.py`

**Đang làm.** Prompt đã được cung cấp ở session trước.

Sau khi Claude Code hoàn thành, kiểm tra:
```bash
# Chạy tests
pytest ai-service/tests/test_dataframe_builder.py -v
pytest ai-service/tests/test_stock_calculator.py -v
pytest ai-service/tests/test_predict_service.py -v
```

Nếu tất cả pass → đánh dấu ✅ và sang Bước 4.

---

## ⬜ Bước 4 — `model_io.py`

**Mục tiêu:** Tách riêng logic save/load model thành 1 util độc lập.

> **Lý do tách riêng:** `train_service.py` và `predict_service.py` đều cần save/load.
> Nếu để inline sẽ bị duplicate. Bước này refactor lại cho sạch.

**Prompt:**

```
Đọc:
1. ai-service/CLAUDE.md
2. ai-service/app/services/train_service.py  (xem đang save/load model như thế nào)
3. ai-service/app/services/predict_service.py (xem đang load model như thế nào)

Task: Tạo app/utils/model_io.py và refactor train_service + predict_service dùng nó.

Viết plan tại docs/plans/{hôm nay}/04-model-io.md

--- app/utils/model_io.py ---

1. save_model(model: NeuralProphet, tenant_id: str) -> Path
   - Lưu vào: storage/models/{tenant_id}/global_model.np
   - Dùng neuralprophet.save() — KHÔNG dùng pickle
   - Tự tạo folder nếu chưa có
   - Ghi kèm train_metadata.json:
     {
       "trained_at": "ISO datetime",
       "tenant_id": "...",
       "series_count": N,
       "model_path": "..."
     }

2. load_model(tenant_id: str) -> NeuralProphet | None
   - Load từ storage/models/{tenant_id}/global_model.np
   - Return None nếu file không tồn tại
   - Bắt exception nếu file corrupt: xóa file, log error, return None

3. model_exists(tenant_id: str) -> bool
   - Kiểm tra file .np tồn tại

4. get_train_metadata(tenant_id: str) -> dict | None
   - Đọc train_metadata.json
   - Return None nếu chưa có

5. list_all_models() -> list[str]
   - Liệt kê tất cả tenant_id đã có model
   - Scan folder storage/models/

--- Refactor ---
- Xóa inline save/load trong train_service.py, thay bằng model_io.save_model()
- Xóa inline load trong predict_service.py, thay bằng model_io.load_model()
- Đảm bảo không thay đổi behavior, chỉ refactor

Yêu cầu:
- Docstring tiếng Việt
- Test: tests/test_model_io.py (test save, load, load file không tồn tại, load file corrupt)
- Xác nhận tôi trước khi sang bước tiếp theo
```

**Kiểm tra xong:**
```bash
pytest ai-service/tests/test_model_io.py -v
```

---

## ⬜ Bước 5 — Hoàn thiện Pydantic Schemas

**Mục tiêu:** Định nghĩa đầy đủ request/response schema cho tất cả API.

**Prompt:**

```
Đọc:
1. ai-service/CLAUDE.md phần 3.3
2. ai-service/app/schemas/ (xem đã có gì)
3. ai-service/docs/architecture/ai-service-structure.md phần 5 (API endpoints)

Task: Hoàn thiện toàn bộ schemas

Viết plan tại docs/plans/{hôm nay}/05-schemas.md

--- app/schemas/forecast.py ---

class DayForecast(BaseModel):
    date: date
    predicted_qty: float

class IngredientForecast(BaseModel):
    ingredient_id: str
    ingredient_name: str
    unit: str
    current_stock: float
    forecast_days: list[DayForecast]    # 7 ngày tới
    stockout_date: date | None          # None = đủ hàng
    suggested_order_qty: float
    suggested_order_date: date
    urgency: Literal["ok", "warning", "critical"]
    is_fallback: bool                   # True = dùng average, không có model

class ForecastResponse(BaseModel):
    branch_id: str
    branch_name: str
    generated_at: datetime
    last_trained_at: datetime | None    # Thời điểm model được train lần cuối
    ingredients: list[IngredientForecast]

    @property
    def urgent_count(self) -> int:
        return sum(1 for i in self.ingredients if i.urgency == "critical")

    @property
    def warning_count(self) -> int:
        return sum(1 for i in self.ingredients if i.urgency == "warning")

--- app/schemas/train.py ---

class TrainRequest(BaseModel):
    tenant_id: str | None = None     # None = dùng tenant của token

class TrainResult(BaseModel):
    tenant_id: str
    status: Literal["success", "skipped", "failed"]
    series_count: int
    series_skipped: list[str]
    mae: float | None
    duration_seconds: float
    error: str | None

class TrainStatusResponse(BaseModel):
    tenant_id: str
    last_trained_at: datetime | None
    status: str | None
    series_count: int | None
    mae: float | None
    model_exists: bool

Yêu cầu:
- Dùng model_config = ConfigDict(from_attributes=True) cho ORM compatibility
- Xác nhận tôi trước khi sang bước tiếp theo
```

---

---

# PHẦN 2 — API LAYER

---

## ⬜ Bước 6 — `security.py` + `api/deps.py`

**Mục tiêu:** Xác thực JWT từ Spring Boot, extract tenant_id.

**Prompt:**

```
Đọc:
1. ai-service/CLAUDE.md phần 4 (MULTI-TENANT)
2. ai-service/app/core/config.py (xem JWT_SECRET đã có chưa)

Task: Implement security và dependencies

Viết plan tại docs/plans/{hôm nay}/06-security.md

--- app/core/security.py ---

1. verify_token(token: str) -> dict
   - Dùng python-jose hoặc PyJWT để decode
   - Đọc JWT_SECRET + JWT_ALGORITHM từ config
   - Raise HTTPException(401) nếu invalid/expired
   - Raise HTTPException(403) nếu payload không có tenant_id
   - Return payload dict

2. extract_tenant_id(payload: dict) -> str
   - Lấy tenant_id từ payload
   - Thử các key: "tenant_id", "tenantId", "sub" theo thứ tự
   - Raise HTTPException(403) nếu không tìm thấy

--- app/api/deps.py ---

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session

async def get_current_tenant(
    token: str | None = Depends(oauth2_scheme)
) -> str:
    if not token:
        raise HTTPException(401, "Missing token")
    payload = security.verify_token(token)
    return security.extract_tenant_id(payload)

async def verify_branch_access(
    branch_id: str,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> str:
    """Kiểm tra branch thuộc tenant — tránh tenant A xem data tenant B."""
    branch = await db.execute(
        select(Branch).where(
            Branch.id == branch_id,
            Branch.tenant_id == tenant_id
        )
    )
    if not branch.scalar_one_or_none():
        raise HTTPException(403, "Branch không thuộc tenant của bạn")
    return branch_id

Yêu cầu:
- Thêm python-jose[cryptography] hoặc PyJWT vào requirements.txt
- Docstring tiếng Việt
- Test: tests/test_security.py (test token valid, expired, missing tenant_id)
- Xác nhận tôi trước khi sang bước tiếp theo
```

---

## ⬜ Bước 7 — API Forecast Endpoint

**Mục tiêu:** Endpoint chính — Spring Boot gọi để lấy dự báo kho.

**Prompt:**

```
Đọc:
1. ai-service/app/schemas/forecast.py
2. ai-service/app/api/deps.py
3. ai-service/docs/skills/vibe-coding-services.md phần API ENDPOINT

Task: Implement app/api/v1/forecast.py

Viết plan tại docs/plans/{hôm nay}/07-forecast-api.md

1. GET /api/v1/forecast/{branch_id}
   - Dependency: verify_branch_access (tự động check branch thuộc tenant)
   - Query forecast_results WHERE branch_id=? AND forecast_date >= TODAY
   - JOIN ingredients để lấy tên, đơn vị, current_stock
   - JOIN model_registry để lấy last_trained_at
   - Map kết quả sang ForecastResponse schema
   - Thêm header: Cache-Control: max-age=300

2. GET /api/v1/forecast/{branch_id}/{ingredient_id}
   - Filter thêm ingredient_id
   - Trả về chi tiết 1 nguyên liệu duy nhất

3. GET /api/v1/forecast/{branch_id}/summary
   - Chỉ trả về: urgent_count, warning_count, ok_count, generated_at
   - Dùng cho dashboard overview (load nhanh hơn)

Yêu cầu:
- Response time < 200ms (chỉ đọc DB, KHÔNG chạy model)
- Log thời gian xử lý mỗi request
- Nếu forecast_results trống (chưa predict lần nào):
  Return 200 với ingredients=[], thêm message "Dữ liệu đang được chuẩn bị"
  KHÔNG return 404
- Mount router vào app/main.py
- Xác nhận tôi trước khi sang bước tiếp theo
```

---

## ⬜ Bước 8 — API Train Endpoint

**Mục tiêu:** Cho phép trigger train thủ công từ giao diện quản trị.

**Prompt:**

```
Đọc:
1. ai-service/app/schemas/train.py
2. ai-service/app/services/train_service.py
3. ai-service/app/api/deps.py

Task: Implement app/api/v1/train.py

Viết plan tại docs/plans/{hôm nay}/08-train-api.md

1. POST /api/v1/train/trigger
   - Chỉ Owner/Admin gọi được (kiểm tra role trong JWT payload)
   - Body: TrainRequest (tenant_id optional, None = dùng tenant của token)
   - Chạy train trong background với BackgroundTasks
   - Return NGAY: {"message": "Train job đã được khởi động", "tenant_id": "..."}
   - KHÔNG block request chờ train xong

2. GET /api/v1/train/status
   - Đọc TrainLog mới nhất của tenant từ token
   - Return TrainStatusResponse

3. GET /api/v1/train/status/{tenant_id}
   - Admin only: xem status của bất kỳ tenant nào
   - Kiểm tra role admin trong JWT

Background task wrapper:
   async def run_train_background(tenant_id: str):
       async with SessionLocal() as db:
           try:
               result = await train_service.train_tenant(tenant_id, db)
               logger.info(f"Background train hoàn thành: {result}")
           except Exception as e:
               logger.error(f"Background train thất bại: {e}")

Mount router vào app/main.py
Xác nhận tôi trước khi sang bước tiếp theo
```

---

---

# PHẦN 3 — SCHEDULER + WEATHER

---

## ⬜ Bước 9 — `scheduler/`

**Mục tiêu:** Cron jobs tự động chạy train + predict mỗi đêm.

**Prompt:**

```
Đọc:
1. ai-service/CLAUDE.md phần 6 (QUY TRÌNH TRAIN/PREDICT)
2. ai-service/app/core/config.py (xem TRAIN_CRON_HOUR, PREDICT_CRON_HOUR đã có chưa)
3. ai-service/app/services/train_service.py
4. ai-service/app/services/predict_service.py

Task: Implement app/scheduler/

Viết plan tại docs/plans/{hôm nay}/09-scheduler.md

--- app/scheduler/jobs.py ---

Khai báo 3 job functions:

1. async def job_train_all_tenants():
   async with SessionLocal() as db:
       logger.info("=== BẮT ĐẦU JOB TRAIN ===")
       results = await train_service.train_all_tenants(db)
       logger.info(f"=== KẾT THÚC JOB TRAIN: {len(results)} tenant ===")

2. async def job_predict_all_branches():
   async with SessionLocal() as db:
       logger.info("=== BẮT ĐẦU JOB PREDICT ===")
       await predict_service.predict_all_branches(db)
       logger.info("=== KẾT THÚC JOB PREDICT ===")

3. async def job_fetch_weather():
   # Implement sau ở Bước 10
   logger.info("Weather job: placeholder — sẽ implement ở Bước 10")

--- app/scheduler/runner.py ---

Dùng APScheduler AsyncIOScheduler:

scheduler = AsyncIOScheduler(timezone="Asia/Ho_Chi_Minh")

def start_scheduler():
    # Train: Chủ nhật 2h sáng
    scheduler.add_job(
        job_train_all_tenants,
        CronTrigger(day_of_week=settings.TRAIN_CRON_DAY_OF_WEEK,
                    hour=settings.TRAIN_CRON_HOUR),
        id="train_all",
        replace_existing=True,
        misfire_grace_time=3600,  # Cho phép chạy muộn 1h nếu server down
    )
    # Predict: mỗi đêm 00:30
    scheduler.add_job(
        job_predict_all_branches,
        CronTrigger(hour=settings.PREDICT_CRON_HOUR,
                    minute=settings.PREDICT_CRON_MINUTE),
        id="predict_all",
        replace_existing=True,
        misfire_grace_time=1800,
    )
    # Weather: mỗi ngày 6h sáng
    scheduler.add_job(
        job_fetch_weather,
        CronTrigger(hour=6, minute=0),
        id="fetch_weather",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler đã khởi động")

def stop_scheduler():
    scheduler.shutdown(wait=False)

--- app/main.py (cập nhật) ---

@app.on_event("startup")
async def startup_event():
    from app.scheduler.runner import start_scheduler
    start_scheduler()

@app.on_event("shutdown")
async def shutdown_event():
    from app.scheduler.runner import stop_scheduler
    stop_scheduler()

Thêm vào .env.example:
TRAIN_CRON_HOUR=2
TRAIN_CRON_DAY_OF_WEEK=sun
PREDICT_CRON_HOUR=0
PREDICT_CRON_MINUTE=30

Yêu cầu:
- Wrap mỗi job trong try/except — job fail không crash scheduler
- Log rõ ràng start/end + duration của mỗi job
- Xác nhận tôi trước khi sang bước tiếp theo
```

---

## ⬜ Bước 10 — `weather_service.py`

**Mục tiêu:** Lấy dự báo thời tiết cho từng chi nhánh, dùng Open-Meteo (miễn phí, không cần API key).

**Prompt:**

```
Đọc:
1. ai-service/CLAUDE.md phần 7 (TÍCH HỢP THỜI TIẾT)
2. ai-service/app/services/data_service.py (xem get_branch_coordinates)
3. ai-service/app/models/ (xem weather_cache model nếu đã có, nếu chưa thì tạo)

Task: Implement app/services/weather_service.py

Viết plan tại docs/plans/{hôm nay}/10-weather-service.md

Bước 1 — Tạo bảng weather_cache (nếu chưa có):
   CREATE TABLE weather_cache (
       id          SERIAL PRIMARY KEY,
       branch_id   VARCHAR NOT NULL,
       date        DATE NOT NULL,
       temperature FLOAT,      -- °C nhiệt độ max trong ngày
       precipitation FLOAT,    -- mm lượng mưa
       cached_at   TIMESTAMP DEFAULT NOW(),
       UNIQUE (branch_id, date)
   );
   → Thêm vào Alembic: alembic/versions/002_add_weather_cache.py

Bước 2 — Implement weather_service.py:

1. async def fetch_weather_for_branch(branch_id: str, db: AsyncSession) -> bool
   - Lấy (lat, lng) từ data_service.get_branch_coordinates()
   - Nếu không có tọa độ: log warning, return False
   - Kiểm tra cache: nếu hôm nay đã có → skip, return True
   - Gọi Open-Meteo API:
     GET https://api.open-meteo.com/v1/forecast
     params:
       latitude={lat}
       longitude={lng}
       daily=temperature_2m_max,precipitation_sum
       timezone=Asia/Ho_Chi_Minh
       forecast_days=8
   - Parse response → lưu vào weather_cache (UPSERT)
   - Nếu API lỗi: log warning, return False (KHÔNG raise exception)

2. async def get_weather_df(branch_id: str, dates: list[date], db: AsyncSession) -> pd.DataFrame | None
   - Đọc từ weather_cache
   - Return DataFrame: ds (datetime), temperature (float), precipitation (float)
   - Return None nếu không có data

3. async def fetch_all_branches_weather(db: AsyncSession) -> None
   - Lấy tất cả branch có tọa độ
   - Loop gọi fetch_weather_for_branch()
   - Log: "Đã cập nhật thời tiết cho X/Y chi nhánh"

Bước 3 — Cập nhật scheduler/jobs.py:
   async def job_fetch_weather():
       async with SessionLocal() as db:
           await weather_service.fetch_all_branches_weather(db)

Bước 4 — Tích hợp vào train_service.py (optional):
   Sau model.add_country_holidays("VN"), thêm:
   weather_df = await weather_service.get_weather_df(branch_id, dates, db)
   if weather_df is not None:
       model.add_future_regressor("temperature")
       model.add_future_regressor("precipitation")
       df = df.merge(weather_df, on="ds", how="left")
       df[["temperature","precipitation"]] = df[["temperature","precipitation"]].fillna(0)

Yêu cầu:
- Tích hợp thời tiết là OPTIONAL — nếu không có data thời tiết thì train/predict vẫn chạy bình thường
- Thêm httpx vào requirements.txt nếu chưa có
- Xác nhận tôi trước khi sang bước tiếp theo
```

---

---

# PHẦN 4 — TEST + TÍCH HỢP

---

## ⬜ Bước 11 — Test end-to-end

**Mục tiêu:** Chạy toàn bộ luồng thật trước khi kết nối Spring Boot.

**Prompt:**

```
Task: Test toàn bộ AI service end-to-end

Bước 1 — Khởi động service:
   cd ai-service
   uvicorn app.main:app --reload --port 8001
   curl http://localhost:8001/health
   → Kỳ vọng: {"status": "ok", "service": "smartfnb-ai"}

Bước 2 — Tạo script test thủ công scripts/e2e_test.py:

   async def main():
       async with SessionLocal() as db:
           # 1. Insert sample data (nếu DB test trống)
           await insert_sample_data(db)  # 3 branch, 5 ingredient, 90 ngày

           # 2. Test data_service
           df = await data_service.get_all_consumption_for_tenant("test_tenant", db=db)
           print(f"Data shape: {df.shape}")
           assert df.shape[0] > 0, "Không có data!"

           # 3. Test train
           result = await train_service.train_tenant("test_tenant", db=db)
           print(f"Train result: {result}")
           assert result.status == "success"

           # 4. Test predict
           await predict_service.predict_all_branches(db=db)
           print("Predict xong!")

           # 5. Kiểm tra forecast_results
           rows = await db.execute(text("SELECT COUNT(*) FROM forecast_results"))
           count = rows.scalar()
           print(f"Forecast rows: {count}")
           assert count > 0, "Không có kết quả predict!"

   asyncio.run(main())

Bước 3 — Test API:
   # Tạo JWT test token (dùng cùng secret với Spring Boot)
   python scripts/gen_test_token.py --tenant-id test_tenant

   # Gọi API
   curl -H "Authorization: Bearer {token}" \
        http://localhost:8001/api/v1/forecast/{branch_id}

   # Kỳ vọng: JSON với danh sách ingredient, urgency, stockout_date

Bước 4 — Chạy toàn bộ unit tests:
   pytest ai-service/tests/ -v --tb=short

Bước 5 — Với mỗi lỗi phát hiện:
   - Tạo file docs/dev-notes/BUG-{hôm nay}-{số}.md
   - Mô tả: lỗi gì, ở đâu, cách fix
   - Fix trong code

Bước 6 — Cập nhật docs/plans/current-sprint.md
```

---

## ⬜ Bước 12 — Kết nối Spring Boot

**Mục tiêu:** Spring Boot gọi được AI service và cache kết quả.

> ⚠️ Bước này làm trong project Spring Boot, KHÔNG sửa ai-service.
> Nếu phát hiện vấn đề từ phía AI, tạo report: `ai-service/docs/dev-notes/BUG-{date}-be-integration.md`

**Prompt (dùng cho Spring Boot project):**

```
Task: Tích hợp AI Service vào Spring Boot

File 1 — AIServiceClient.java:

@Service
public class AIServiceClient {

    @Value("${ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;

    @Value("${ai.service.timeout:5000}")
    private int timeoutMs;

    private final RestTemplate restTemplate;

    // Constructor với timeout config
    public AIServiceClient() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restTemplate = new RestTemplate(factory);
    }

    public ForecastResponseDTO getForecast(String branchId, String jwtToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(jwtToken);  // Forward JWT từ FE request
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            return restTemplate.exchange(
                aiServiceUrl + "/api/v1/forecast/" + branchId,
                HttpMethod.GET,
                entity,
                ForecastResponseDTO.class
            ).getBody();
        } catch (Exception e) {
            log.error("AI service không khả dụng: {}", e.getMessage());
            return ForecastResponseDTO.empty(branchId);  // Fallback: trả về rỗng
        }
    }

    public void triggerTrain(String tenantId, String jwtToken) {
        // Gọi POST /api/v1/train/trigger nếu cần trigger thủ công
    }
}

File 2 — ForecastResponseDTO.java + IngredientForecastDTO.java:
   Tạo các DTO tương ứng với ForecastResponse schema của Python

File 3 — InventoryForecastService.java:
   @Service
   public class InventoryForecastService {
       public ForecastResponseDTO getForecastForBranch(String branchId, String jwtToken) {
           return aiServiceClient.getForecast(branchId, jwtToken);
       }
   }

File 4 — InventoryController.java (thêm endpoint):
   @GetMapping("/inventory/forecast/{branchId}")
   public ResponseEntity<ForecastResponseDTO> getForecast(
       @PathVariable String branchId,
       HttpServletRequest request  // Lấy JWT từ Authorization header
   ) {
       String token = extractToken(request);
       return ResponseEntity.ok(inventoryForecastService.getForecastForBranch(branchId, token));
   }

File 5 — application.properties:
   ai.service.url=http://localhost:8001
   ai.service.timeout=5000

Test: Gọi GET /api/inventory/forecast/{branchId} từ Postman
→ Kỳ vọng: nhận được JSON dự báo từ AI service
```

---

## ⬜ Bước 13 — Kết nối React Frontend

**Mục tiêu:** Hiển thị cảnh báo kho và dự báo lên giao diện.

> ⚠️ Bước này làm trong React project.

**Prompt (dùng cho React project):**

```
Task: Implement trang báo cáo kho thông minh

File 1 — src/types/forecast.ts:
   export interface DayForecast {
     date: string;
     predicted_qty: number;
   }

   export interface IngredientForecast {
     ingredient_id: string;
     ingredient_name: string;
     unit: string;
     current_stock: number;
     forecast_days: DayForecast[];
     stockout_date: string | null;
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

File 2 — src/hooks/useForecast.ts:
   - useForecast(branchId: string)
   - Gọi GET /api/inventory/forecast/{branchId} (Spring Boot, KHÔNG gọi AI trực tiếp)
   - Return { data, isLoading, error, refetch }
   - Auto-refetch mỗi 5 phút

File 3 — src/components/inventory/IngredientAlertCard.tsx:
   Props: ingredient: IngredientForecast
   Hiển thị:
   - Badge màu theo urgency: đỏ (critical), vàng (warning), xanh (ok)
   - Tên nguyên liệu + tồn kho hiện tại
   - "Dự kiến hết: DD/MM/YYYY (còn N ngày)"
   - "Gợi ý nhập: X kg vào ngày DD/MM"
   - Mini chart 7 ngày (dùng recharts BarChart)
   - Nếu is_fallback=true: badge nhỏ "Dự báo tạm thời"

File 4 — src/pages/InventoryForecastPage.tsx:
   - Lấy branchId từ context hoặc route params
   - Dùng useForecast hook
   - Sort ingredients: critical → warning → ok
   - Hiển thị summary: X cần nhập ngay, Y sắp hết, Z ổn
   - Hiển thị "Cập nhật lúc {generated_at}"
   - Skeleton loading khi đang fetch

Thêm route vào router:
   /inventory/forecast/:branchId → InventoryForecastPage

Xác nhận tôi sau mỗi file
```

---

---

# PHẦN 5 — HARDENING + DEPLOY

---

## ⬜ Bước 14 — Edge cases + Hardening

**Mục tiêu:** Xử lý các tình huống đặc biệt trong production.

**Prompt:**

```
Đọc:
1. ai-service/CLAUDE.md phần 9 (NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG LÀM)
2. Toàn bộ ai-service/app/ (review lại một lượt)

Task: Hardening — xử lý edge cases

Bước 1 — Tenant/Branch mới, ít data:
   train_service.py:
   - Nếu tenant có 0 series đủ ngày → status='skipped', ghi log rõ lý do
   - Log từng series bị skip: "Skip {series_id}: chỉ {n} ngày < 30"

Bước 2 — Scheduler fail alert:
   scheduler/jobs.py — wrap mỗi job:
   async def job_train_all_tenants():
       start = time.time()
       try:
           ...
       except Exception as e:
           duration = time.time() - start
           logger.error(f"JOB TRAIN THẤT BẠI sau {duration:.1f}s: {e}")
           # Gửi webhook nếu có config
           if settings.ALERT_WEBHOOK_URL:
               await send_alert(f"AI Train job failed: {e}")
           # KHÔNG re-raise — scheduler tiếp tục chạy

Bước 3 — Model file corrupt:
   model_io.load_model():
   try:
       model = load(str(path))
       return model
   except Exception as e:
       logger.error(f"Model corrupt: {path} — {e}")
       path.unlink(missing_ok=True)  # Xóa file lỗi
       return None  # predict_service sẽ dùng fallback

Bước 4 — DB connection resilience:
   database.py — thêm vào create_async_engine():
   pool_size=5,
   max_overflow=10,
   pool_timeout=30,
   pool_recycle=1800,  # Recycle connection sau 30 phút

Bước 5 — Validate tất cả .env variables khi startup:
   config.py — thêm @model_validator:
   Raise ValueError rõ ràng nếu DATABASE_URL hoặc JWT_SECRET bị trống

Bước 6 — Health check chi tiết:
   health.py — cập nhật GET /health:
   {
     "status": "ok",
     "service": "smartfnb-ai",
     "db": "connected" | "error",
     "scheduler": "running" | "stopped",
     "models_loaded": N  // số tenant đã có model
   }

Bước 7 — Chạy lại toàn bộ tests:
   pytest ai-service/tests/ -v --tb=short
   → Tất cả phải pass trước khi sang Bước 15
```

---

## ⬜ Bước 15 — Dockerfile + docker-compose + README

**Mục tiêu:** Đóng gói để deploy, viết tài liệu bàn giao.

**Prompt:**

```
Task: Đóng gói và viết tài liệu

--- Dockerfile ---
FROM python:3.11-slim

WORKDIR /app

# Cài dependencies trước (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Tạo folder storage
RUN mkdir -p storage/models

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]

--- docker-compose.yml (thêm vào file project đã có) ---
  ai-service:
    build: ./ai-service
    container_name: smartfnb-ai
    ports:
      - "8001:8001"      # Chỉ expose trong dev — production dùng internal network
    env_file:
      - ./ai-service/.env
    volumes:
      - ai_models:/app/storage/models   # Persist model files
    depends_on:
      - postgres
    networks:
      - internal
    restart: unless-stopped

volumes:
  ai_models:

--- .dockerignore ---
__pycache__/
*.pyc
.env
storage/models/
tests/
docs/
*.md
.git/

--- README.md ---
Viết hướng dẫn:
1. Setup local: clone, tạo venv, copy .env.example → .env, điền DB + JWT_SECRET
2. Chạy migration: alembic upgrade head
3. Chạy service: uvicorn app.main:app --reload --port 8001
4. Trigger train thủ công: POST /api/v1/train/trigger với JWT
5. Xem kết quả: GET /api/v1/forecast/{branch_id} với JWT
6. Cron jobs: train Chủ nhật 2h, predict mỗi đêm 12h30, weather 6h sáng
7. Troubleshooting: model không tồn tại, DB connection lỗi, JWT sai

--- Final checklist ---
Chạy lần lượt:
□ grep -rn "print(" app/                          → không có print debug
□ pytest tests/ -v                                → tất cả pass
□ docker build -t smartfnb-ai .                   → build thành công
□ docker run -p 8001:8001 smartfnb-ai             → service khởi động
□ curl http://localhost:8001/health               → {"status": "ok"}
□ Cập nhật docs/plans/current-sprint.md
□ Cập nhật docs/architecture/api-endpoints.md
```

---

---

## 📊 Bảng theo dõi tiến độ tổng thể

| # | Bước | File chính | Trạng thái |
|---|---|---|---|
| 0 | Skeleton + DB | models/, alembic/ | ✅ Xong |
| 1 | Data service | data_service.py | ✅ Xong |
| 2 | Train service | train_service.py | ✅ Xong |
| 3 | Builder + Calculator + Predict | dataframe_builder.py, stock_calculator.py, predict_service.py | 🔄 Đang làm |
| 4 | Model IO | model_io.py | ⬜ Chưa |
| 5 | Schemas | schemas/ | ⬜ Chưa |
| 6 | Security + Deps | security.py, deps.py | ⬜ Chưa |
| 7 | Forecast API | api/v1/forecast.py | ⬜ Chưa |
| 8 | Train API | api/v1/train.py | ⬜ Chưa |
| 9 | Scheduler | scheduler/ | ⬜ Chưa |
| 10 | Weather | weather_service.py | ⬜ Chưa |
| 11 | E2E Test | scripts/e2e_test.py | ⬜ Chưa |
| 12 | Spring Boot | AIServiceClient.java | ⬜ Chưa |
| 13 | React FE | InventoryForecastPage.tsx | ⬜ Chưa |
| 14 | Hardening | Toàn bộ | ⬜ Chưa |
| 15 | Deploy | Dockerfile, README | ⬜ Chưa |

---

## 💡 Nguyên tắc làm việc

```
1. Luôn đọc CLAUDE.md + current-sprint.md ở đầu mỗi session
2. Viết plan trước khi code (docs/plans/{ngày}/{số}-{tên}.md)
3. Xác nhận Claude Code sau mỗi file — không để nó tự chạy hết
4. Cập nhật bảng tiến độ trên sau mỗi bước hoàn thành
5. Nếu phát hiện bug ở BE/FE → tạo report, không sửa code ngoài ai-service/
6. pytest tests/ -v phải pass trước khi sang bước tiếp theo
```
