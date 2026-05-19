# ⚡ SmartF&B AI Service — Vibe Coding Quick-Start Guide
> Prompt nhanh cho từng service/feature. Copy paste khi bắt đầu implement.

---

## 🚀 CÁCH SỬ DỤNG

Khi bắt đầu một tính năng, nói với AI:
> "Đọc `CLAUDE.md` và `docs/skills/vibe-coding-services.md`, sau đó implement [task]"

---

## 🧠 DATA SERVICE — Lấy data từ DB
```
Implement hàm [X] trong data_service.py cho SmartF&B AI Service.

CONTEXT:
- DB chung với Spring Boot BE (PostgreSQL)
- Mọi query BẮT BUỘC filter tenant_id và branch_id
- Dùng SQLAlchemy async (asyncpg driver)
- Return pd.DataFrame với cột [ds, y, ID] chuẩn NeuralProphet

Hàm cần implement:
- get_ingredient_consumption(tenant_id, branch_id, ingredient_id, days_back=180)
  → DataFrame: ds (datetime), y (float: lượng tiêu thụ mỗi ngày)

- get_all_consumption_for_tenant(tenant_id, days_back=180)
  → DataFrame: ds, y, ID (format: {tenant_id}__{ingredient_id}__{branch_id})
  → Dùng cho Global Model training

- get_current_stock(tenant_id, branch_id, ingredient_id) → float

- get_active_ingredients(tenant_id, branch_id) → list[IngredientInfo]

- get_branch_coordinates(branch_id) → tuple[float, float] | None  (lat, lng)

Schema DB của BE (read-only):
- orders: id, branch_id, tenant_id, status, created_at
- order_details: order_id, menu_item_id, quantity
- recipes: menu_item_id, ingredient_id, quantity_used, unit
- ingredients: id, tenant_id, branch_id, name, unit, current_stock
- branches: id, tenant_id, name, latitude, longitude

Lưu ý:
- Join orders → order_details → recipes để tính lượng tiêu thụ thực tế
- Chỉ tính đơn hàng có status = 'COMPLETED'
- Group by ngày (DATE(created_at)), sum lượng tiêu thụ
- Ngày không có đơn → y = 0 (không bỏ trống để NeuralProphet không bị lỗi)
```

---

## 🏋️ TRAIN SERVICE — Train NeuralProphet
```
Implement train_service.py cho SmartF&B AI Service.

CONTEXT:
- Dùng NeuralProphet Global Model: 1 model cho tất cả nguyên liệu × chi nhánh của 1 tenant
- Cột ID format: "{tenant_id}__{ingredient_id}__{branch_id}"
- Lưu model vào: storage/models/{tenant_id}/global_model.np
- Lưu metadata vào: storage/models/{tenant_id}/train_metadata.json
- Ghi log vào bảng train_logs

Hàm cần implement:
- train_tenant(tenant_id: str, db: AsyncSession) -> TrainResult
  1. Gọi data_service.get_all_consumption_for_tenant()
  2. Validate data (check MIN_DAYS_REQUIRED = 30 per series)
  3. Thêm ngày lễ VN: model.add_country_holidays("VN")
  4. Thêm regressor thời tiết nếu có data (optional, không fail nếu thiếu)
  5. fit(df, freq="D")
  6. save model + ghi metadata (số series, MAE, thời gian train)
  7. Ghi train_log với status success/failed

- train_all_tenants(db: AsyncSession) -> list[TrainResult]
  → Loop qua tất cả tenant active, gọi train_tenant(), batch từng tenant

NeuralProphet config chuẩn:
  NeuralProphet(
      n_forecasts=7,
      n_lags=14,
      weekly_seasonality=True,
      daily_seasonality=False,
      yearly_seasonality=False,
      epochs=100,
  )

Edge cases cần xử lý:
- Series có < 30 ngày data: skip, log warning
- Train thất bại 1 tenant: continue tenant khác, log error
- Model file đã tồn tại: overwrite (không cần backup trong MVP)
```

---

## 🔮 PREDICT SERVICE — Dự báo & Tính kho
```
Implement predict_service.py cho SmartF&B AI Service.

CONTEXT:
- Load model từ storage/models/{tenant_id}/global_model.np
- Predict 7 ngày tới cho mỗi nguyên liệu × chi nhánh
- Ghi kết quả vào bảng forecast_results (upsert)
- Không chạy model real-time trong API — chỉ đọc từ forecast_results

Hàm cần implement:
- predict_branch(tenant_id, branch_id, db) -> list[IngredientPrediction]
  1. Load global model
  2. Lấy 14 ngày gần nhất làm context (n_lags=14)
  3. make_future_dataframe(df, periods=7)
  4. predict() → lấy cột yhat1 (clip giá trị âm về 0)
  5. Với mỗi ingredient: gọi stock_calculator
  6. Upsert vào forecast_results

- predict_all_branches(db) -> None
  → Loop qua tất cả tenant → branch, gọi predict_branch()

Fallback khi chưa có model:
- Log warning
- Dùng average 7 ngày gần nhất làm dự báo thô
- Đánh dấu is_fallback=True trong forecast_results

Upsert pattern (tránh duplicate):
  INSERT INTO forecast_results (...) VALUES (...)
  ON CONFLICT (branch_id, ingredient_id, forecast_date)
  DO UPDATE SET predicted_qty = EXCLUDED.predicted_qty, ...
```

---

## 🌡️ WEATHER SERVICE — Thời tiết
```
Implement weather_service.py cho SmartF&B AI Service.

CONTEXT:
- Open-Meteo API: miễn phí, không cần API key
- Mỗi chi nhánh có lat/lng riêng trong bảng branches
- Cache vào DB để không gọi API lặp lại trong ngày
- Đưa vào model dưới dạng future regressor (nhiệt độ, lượng mưa)

API endpoint:
  GET https://api.open-meteo.com/v1/forecast
  params: latitude, longitude, daily=[temperature_2m_max, precipitation_sum],
          timezone=Asia/Ho_Chi_Minh, forecast_days=8

Hàm cần implement:
- fetch_weather_for_branch(branch_id, db) -> WeatherForecast
  → Gọi Open-Meteo, lưu cache vào bảng weather_cache

- get_weather_regressor_df(branch_id, dates, db) -> pd.DataFrame
  → Return DataFrame: ds, temperature, precipitation
  → Dùng để add_future_regressor() vào NeuralProphet

Lưu ý:
- Thêm regressor PHẢI được thêm vào model trước khi fit()
- Nếu không lấy được thời tiết (API lỗi), bỏ qua regressor, không fail
```

---

## 🔌 API ENDPOINT — Serve kết quả
```
Implement endpoint GET /api/v1/forecast/{branch_id} trong app/api/v1/forecast.py

CONTEXT:
- Chỉ đọc từ bảng forecast_results — KHÔNG chạy model real-time
- Response time phải < 200ms
- Cần xác thực JWT (lấy tenant_id từ token, verify branch thuộc tenant)
- BE Spring Boot sẽ gọi endpoint này và cache lại

Response schema (ForecastResponse):
{
  "branch_id": "branch_q1",
  "branch_name": "Chi nhánh Q1",
  "generated_at": "2026-04-14T01:00:00",
  "ingredients": [
    {
      "ingredient_id": "ing_001",
      "ingredient_name": "Hạt Arabica",
      "unit": "kg",
      "current_stock": 15.5,
      "forecast_days": [
        { "date": "2026-04-15", "predicted_qty": 2.3 },
        ...
      ],
      "stockout_date": "2026-04-21",        // null nếu đủ hàng
      "suggested_order_qty": 10.0,
      "suggested_order_date": "2026-04-19", // 2 ngày trước khi hết
      "urgency": "warning"                  // ok | warning | critical
    }
  ]
}

Urgency rules:
- critical: stockout_date <= 2 ngày tới
- warning: stockout_date <= 5 ngày tới
- ok: đủ hàng trong 7 ngày
```
