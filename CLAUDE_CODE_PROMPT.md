# 🚀 CLAUDE CODE — Prompt Khởi Tạo AI Service (SmartF&B)

## Cách dùng
Copy toàn bộ nội dung trong block dưới đây, paste vào Claude Code khi bắt đầu phiên làm việc mới với AI service.

---

```
Bạn là Senior MLOps Engineer đang làm việc trên dự án SmartF&B.

## Bước 1 — Đọc context (BẮT BUỘC trước khi làm bất kỳ thứ gì)

Đọc tuần tự các file sau:
1. `ai-service/CLAUDE.md`                                    — coding rules & conventions
2. `AI_PROJECT_STRUCTURE.md`                                 — bức tranh tổng thể hệ thống
3. `ai-service/docs/architecture/ai-service-structure.md`   — cấu trúc chi tiết AI service
4. `ai-service/docs/plans/current-sprint.md`                — task đang cần làm (nếu file tồn tại)

Sau đó chạy:
- `find ai-service/app -type f -name "*.py" | sort`          — xem file nào đã có
- `ls ai-service/storage/models/ 2>/dev/null || echo "Chưa có model nào"`

## Bước 2 — Xác nhận hiểu context

Sau khi đọc xong, tóm tắt ngắn cho tôi:
- ✅ File/service đã có
- 🔄 Đang cần implement
- ❓ Điểm nào chưa rõ cần hỏi

## Bước 3 — Bắt đầu task
Task: Tạo skeleton toàn bộ ai-service/ từ đầu.

Yêu cầu:
1. Kiểm tra version python , nếu version thuận lợi cho việc phát triển thì thôi , nếu ko thì đề xuất version 
2. Tạo môi trường ảo 
3. Tạo đúng cấu trúc thư mục theo docs/architecture/ai-service-structure.md
4. Tạo app/core/config.py với Pydantic BaseSettings đọc từ .env
5. Tạo app/core/database.py với SQLAlchemy async engine
6. Tạo app/main.py với FastAPI app cơ bản, mount router health
7. Tạo app/api/v1/health.py → GET /health trả {"status": "ok", "service": "smartfnb-ai"}
8. Tạo requirements.txt với: fastapi, uvicorn, neuralprophet, sqlalchemy[asyncio], asyncpg, apscheduler, pandas, httpx, pydantic-settings
9. Tạo .env.example

Viết plan trước khi code (lưu vào docs/plans/{hôm nay}/01-init-skeleton.md).
Sau đó tạo từng file, xác nhận tôi trước khi chuyển sang file tiếp theo.
```

---

## 📋 Các prompt task mẫu (copy vào Bước 3)

### Task: Khởi tạo project từ đầu
```
Task: Tạo skeleton toàn bộ ai-service/ từ đầu.

Yêu cầu:
1. Tạo đúng cấu trúc thư mục theo docs/architecture/ai-service-structure.md
2. Tạo app/core/config.py với Pydantic BaseSettings đọc từ .env
3. Tạo app/core/database.py với SQLAlchemy async engine
4. Tạo app/main.py với FastAPI app cơ bản, mount router health
5. Tạo app/api/v1/health.py → GET /health trả {"status": "ok", "service": "smartfnb-ai"}
6. Tạo requirements.txt với: fastapi, uvicorn, neuralprophet, sqlalchemy[asyncio], asyncpg, apscheduler, pandas, httpx, pydantic-settings
7. Tạo .env.example

Viết plan trước khi code (lưu vào docs/plans/{hôm nay}/01-init-skeleton.md).
Sau đó tạo từng file, xác nhận tôi trước khi chuyển sang file tiếp theo.
```

### Task: Implement data_service
```
Task: Implement app/services/data_service.py

Viết plan trước (docs/plans/{hôm nay}/02-data-service.md), rồi implement:

1. get_all_consumption_for_tenant(tenant_id, days_back=180) -> pd.DataFrame
   - JOIN: orders → order_details → recipes → ingredients
   - Filter: orders.tenant_id = tenant_id AND orders.status = 'COMPLETED'
   - Group by: DATE(orders.created_at), ingredient_id, branch_id
   - Cột ID: "{tenant_id}__{ingredient_id}__{branch_id}"
   - Điền ngày thiếu với y=0

2. get_current_stock(tenant_id, branch_id, ingredient_id) -> float
3. get_active_ingredients(tenant_id, branch_id) -> list[dict]
4. get_branch_coordinates(branch_id) -> tuple[float, float] | None

Yêu cầu:
- Dùng SQLAlchemy async
- Mọi query phải filter tenant_id
- Có docstring tiếng Việt
- Có test trong tests/test_data_service.py với sample data

Tham khảo DB schema trong docs/architecture/ai-service-structure.md mục 3.
```

### Task: Implement train_service
```
Task: Implement app/services/train_service.py

Viết plan trước (docs/plans/{hôm nay}/03-train-service.md), rồi implement:

1. train_tenant(tenant_id, db) -> TrainResult
   - Gọi data_service.get_all_consumption_for_tenant()
   - Validate: mỗi series cần ít nhất 30 ngày
   - Config NeuralProphet: n_forecasts=7, n_lags=14, weekly_seasonality=True
   - Thêm ngày lễ VN: model.add_country_holidays("VN")
   - Save model: storage/models/{tenant_id}/global_model.np
   - Save metadata: storage/models/{tenant_id}/train_metadata.json
   - Ghi train_log vào DB

2. train_all_tenants(db) -> list[TrainResult]
   - Loop qua tenant active
   - Fail 1 tenant không ảnh hưởng tenant khác

Edge cases:
- Series < 30 ngày: skip với log warning
- Model path chưa tồn tại: tạo folder tự động
- Train lỗi: ghi status='failed' vào train_log, không raise
```

### Task: Implement predict_service
```
Task: Implement app/services/predict_service.py và app/utils/stock_calculator.py

Viết plan trước (docs/plans/{hôm nay}/04-predict-service.md), rồi implement:

stock_calculator.py:
- predict_stockout_date(current_stock, forecast_df) -> date | None
- calc_order_qty(forecast_df, safety_factor=1.2) -> float
- get_urgency(stockout_date) -> "ok" | "warning" | "critical"

predict_service.py:
- predict_branch(tenant_id, branch_id, db) -> list[IngredientPrediction]
  1. Load model từ storage/models/{tenant_id}/global_model.np
  2. Fallback: nếu chưa có model → dùng average 7 ngày gần nhất
  3. make_future_dataframe → predict → clip âm về 0
  4. Gọi stock_calculator
  5. Upsert vào forecast_results

- predict_all_branches(db) -> None

Upsert SQL:
  ON CONFLICT (branch_id, ingredient_id, forecast_date) DO UPDATE SET ...
```

### Task: Implement API endpoint
```
Task: Implement GET /api/v1/forecast/{branch_id} trong app/api/v1/forecast.py

Viết plan trước, rồi implement:

1. Xác thực JWT → lấy tenant_id từ token
2. Verify branch thuộc tenant (tránh tenant A xem data tenant B)
3. Query forecast_results WHERE branch_id = ? AND forecast_date >= TODAY
4. Join với ingredients để lấy tên, đơn vị, current_stock
5. Map sang ForecastResponse schema

Response schema: xem docs/skills/vibe-coding-services.md phần API ENDPOINT

Yêu cầu:
- Response time < 200ms (chỉ đọc DB, không chạy model)
- Xử lý 404 nếu branch không tồn tại
- Xử lý 403 nếu branch không thuộc tenant của user
```

### Task: Setup scheduler
```
Task: Setup APScheduler trong app/scheduler/

Viết plan trước, rồi implement:

jobs.py:
- job_train_all_tenants(): gọi train_service.train_all_tenants()
- job_predict_all_branches(): gọi predict_service.predict_all_branches()
- job_fetch_weather(): gọi weather_service.fetch_all_branches_weather()

runner.py:
- Khởi tạo AsyncIOScheduler
- Đăng ký jobs theo lịch từ config:
  - train: Chủ nhật 02:00 AM (TRAIN_CRON_HOUR, TRAIN_CRON_DAY_OF_WEEK)
  - predict: Hàng đêm 00:30 AM
  - weather: Hàng ngày 06:00 AM
- Start scheduler khi app startup, shutdown khi app shutdown

Tích hợp vào main.py:
  @app.on_event("startup")
  async def startup(): scheduler.start()

  @app.on_event("shutdown")  
  async def shutdown(): scheduler.shutdown()
```

---

## 💡 Tips khi dùng Claude Code

1. **Luôn bắt đầu bằng Bước 1** — đừng skip đọc context, Claude Code sẽ đưa ra code đúng pattern hơn nhiều.

2. **Yêu cầu plan trước** — "Viết plan trước rồi mới code" giúp catch edge cases sớm.

3. **Xác nhận từng file** — thêm "xác nhận tôi trước khi chuyển sang file tiếp theo" để kiểm soát tiến độ.

4. **Khi có bug ở BE** — nói "tôi phát hiện bug ở BE, tạo report" → Claude Code sẽ tạo file `docs/dev-notes/BUG-{date}.md` mà không sửa code BE.

5. **Cập nhật sprint** — sau mỗi feature xong: "cập nhật current-sprint.md và api-endpoints.md"
