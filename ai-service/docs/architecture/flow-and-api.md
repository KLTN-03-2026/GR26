# SmartF&B AI Service — Flow & API Reference

> Cập nhật: 2026-04-16 | Port: 8001 | Auth: JWT HS384 (từ Spring Boot)

---

## Tổng quan 3 tầng

```
[Tầng 1]  TRAIN     — Chủ nhật 02:00   → train NeuralProphet, lưu model .np
[Tầng 2]  PREDICT   — Hàng đêm 00:30   → chạy model, lưu kết quả vào DB
[Tầng 3]  READ API  — FE/BE gọi khi cần → chỉ đọc DB, không chạy model
```

---

## Tầng 1 — Train (Chủ nhật 02:00 AM)

### Mô tả
Train NeuralProphet **Global Model** cho toàn bộ `ingredient × branch` của mỗi tenant.
1 model duy nhất cho mỗi tenant (không phải 1 model/nguyên liệu).

### Cron job
```
scheduler/jobs.py : train_all_tenants()   dòng 21
  └── Lịch: TRAIN_CRON_DAY_OF_WEEK=sun, TRAIN_CRON_HOUR=2
```

### API trigger thủ công
```
POST /api/v1/train/trigger
Authorization: Bearer <token>   (role: OWNER hoặc ADMIN)
Body: {} hoặc {"tenant_id": "..."}   (optional — mặc định lấy từ JWT)

Response 200:
{
  "message": "Train job đã được khởi động",
  "tenant_id": "6bb03956-...",
  "status": "queued"
}
```

### Xem kết quả train
```
GET /api/v1/train/status
Authorization: Bearer <token>

Response 200:
{
  "tenant_id": "6bb03956-...",
  "last_trained_at": "2026-04-15T17:27:35Z",
  "status": "success",        // success | failed | running | null
  "series_count": 15,
  "mae": 0.303,
  "model_exists": true
}
```

### Call stack

```
POST /api/v1/train/trigger
  api/v1/train.py : trigger_train()                     dòng 46
    └── background_tasks.add_task(run_train_background, tenant_id)
          api/v1/train.py : run_train_background()       dòng 25
            └── train_service.run_train_for_tenant(db, tenant_id)
                  services/train_service.py              dòng 206
                  │
                  ├─ data_service.get_all_consumption_for_tenant(db, tenant_id, days_back=180)
                  │    services/data_service.py          — lấy lịch sử tiêu thụ 180 ngày
                  │    → DataFrame [ds, y, ID]  (ID = "s{int}" từ ai_series_registry)
                  │
                  ├─ train_service._filter_valid_series(df)
                  │    services/train_service.py         dòng 120
                  │    → Lọc bỏ series < 30 ngày data
                  │
                  ├─ train_service.validate_training_data(df)
                  │    services/train_service.py         dòng 39
                  │    → Kiểm tra: không NaN, không âm, đủ ngày, đủ series
                  │
                  ├─ train_service.train_global_model(df, tenant_id)
                  │    services/train_service.py         dòng 146
                  │    │
                  │    ├─ _build_neuralprophet_model()   dòng 86
                  │    │    NeuralProphet(n_forecasts=7, n_lags=14, weekly_seasonality=True)
                  │    │    model.add_country_holidays("VN")
                  │    │
                  │    ├─ model.fit(df, freq="D")        — train Global Model
                  │    │
                  │    └─ model_io.save_model(model, tenant_id, series_count)
                  │         utils/model_io.py            dòng 34
                  │         → Lưu: storage/models/{tenant_id}/global_model.np
                  │         → Lưu: storage/models/{tenant_id}/train_metadata.json
                  │
                  └─ Ghi TrainLog vào bảng train_logs    dòng 230
```

### Files được tạo sau Train
```
storage/models/
└── {tenant_id}/
    ├── global_model.np          ← NeuralProphet model (torch serialized)
    └── train_metadata.json      ← {"trained_at", "series_count", "model_path"}
```

---

## Tầng 2 — Predict (Hàng đêm 00:30 AM)

### Mô tả
Load model đã train → chạy dự báo 7 ngày tới cho từng `ingredient × branch` → ghi vào bảng `forecast_results`.

### Cron job
```
scheduler/jobs.py : predict_all_branches()   dòng 49
  └── Lịch: PREDICT_CRON_HOUR=0, PREDICT_CRON_MINUTE=30
```

### API trigger thủ công
```
POST /api/v1/train/predict
Authorization: Bearer <token>   (role: OWNER hoặc ADMIN)

Response 200:
{
  "message": "Predict job đã được khởi động",
  "status": "queued"
}
```

### Call stack

```
POST /api/v1/train/predict
  api/v1/train.py : trigger_predict()                          dòng 144
    └── background_tasks.add_task(run_predict_background)
          api/v1/train.py : run_predict_background()           dòng 132
            └── predict_service.predict_all_branches(db)
                  services/predict_service.py                  dòng 302
                  │
                  ├─ data_service.get_all_active_tenants(db)   — lấy danh sách tenant
                  └─ [với mỗi tenant]
                       data_service.get_all_active_branches(db, tenant_id)
                       └─ [với mỗi branch]
                            predict_service.predict_branch(tenant_id, branch_id, db)
                              services/predict_service.py      dòng 114
                              │
                              ├─ model_io.model_exists(tenant_id)
                              │    utils/model_io.py           dòng 123
                              │    → Kiểm tra file .np có tồn tại không
                              │
                              ├─ model_io.load_model(tenant_id)
                              │    utils/model_io.py           dòng 76
                              │    → torch.load("storage/models/{tenant_id}/global_model.np",
                              │                  weights_only=False)
                              │    → model.restore_trainer(accelerator=None)
                              │    → Trả về None nếu file không tồn tại / corrupt
                              │
                              ├─ data_service.get_all_ingredients_of_branch(db, tenant_id, branch_id)
                              │    — lấy danh sách nguyên liệu trong kho của branch
                              │
                              └─ [với mỗi ingredient]
                                   │
                                   ├─ SeriesRegistryRepo.get_or_create(ingredient_id, branch_id)
                                   │    repositories/series_registry_repo.py
                                   │    → Lấy / tạo mới integer series_id trong ai_series_registry
                                   │
                                   ├─ data_service.get_ingredient_consumption(db, tenant_id,
                                   │    branch_id, ingredient_id, days_back=28)
                                   │    → DataFrame [ds, y] — lịch sử tiêu thụ
                                   │
                                   ├─ data_service.get_current_stock(db, tenant_id,
                                   │    branch_id, ingredient_id)
                                   │    → float — tồn kho hiện tại từ inventory_balances
                                   │
                                   ├─ [NẾU có model]
                                   │    dataframe_builder.build_future_df(history_df, series_id, periods=7)
                                   │      utils/dataframe_builder.py    dòng 154
                                   │      → DataFrame [lịch sử + 7 hàng y=NaN]
                                   │
                                   │    model.predict(future_df)         — NeuralProphet predict
                                   │    → Lấy yhat1..yhat7 từ row lịch sử cuối (KHÔNG lấy future rows)
                                   │      services/predict_service.py   dòng 218-240
                                   │
                                   ├─ [NẾU không có model → fallback]
                                   │    predict_service._build_fallback_forecast(history_df)
                                   │      services/predict_service.py   dòng 33
                                   │      → Dùng trung bình 7 ngày gần nhất làm dự báo phẳng
                                   │
                                   ├─ stock_calculator.predict_stockout_date(current_stock, forecast_df)
                                   │    utils/stock_calculator.py       dòng 25
                                   │    → Tích lũy yhat1 từng ngày, trả về ngày vượt current_stock
                                   │
                                   ├─ stock_calculator.calc_suggested_qty(forecast_df)
                                   │    utils/stock_calculator.py       dòng 65
                                   │    → sum(yhat1) × 1.2 (safety factor 20%)
                                   │
                                   ├─ stock_calculator.calc_suggested_order_date(stockout_date)
                                   │    utils/stock_calculator.py       dòng 92
                                   │    → stockout_date − 2 ngày (lead time)
                                   │
                                   ├─ stock_calculator.get_urgency(stockout_date)
                                   │    utils/stock_calculator.py       dòng 122
                                   │    → "critical" (≤2 ngày) | "warning" (≤5 ngày) | "ok"
                                   │
                                   └─ _upsert_forecast_results(db, series_id_int, ...)
                                        services/predict_service.py     dòng 67
                                        → INSERT ... ON CONFLICT DO UPDATE
                                        → Ghi vào bảng forecast_results
```

### Bảng DB được cập nhật
```
forecast_results
  series_id     → FK → ai_series_registry.id
  forecast_date → date (1 row = 1 ngày)
  predicted_qty → lượng tiêu thụ dự báo
  stockout_date → ngày dự kiến hết hàng (NULL nếu đủ hàng)
  suggested_qty → số lượng gợi ý nhập (× 1.2)
```

---

## Tầng 3 — Read API (FE/BE gọi khi cần)

> **Không chạy model.** Chỉ đọc từ bảng `forecast_results`.
> Response time mục tiêu: < 200ms.

---

### 3a. Dashboard summary (badge cảnh báo)

```
GET /api/v1/forecast/{branch_id}/summary
Authorization: Bearer <token>

Response 200:
{
  "branch_id": "a7fc4472-...",
  "generated_at": "2026-04-16T09:51:31",
  "urgent_count": 2,     // hết hàng trong ≤ 2 ngày
  "warning_count": 3,    // hết hàng trong ≤ 5 ngày
  "ok_count": 10,
  "total_ingredients": 15
}
```

**Call stack:**
```
GET /api/v1/forecast/{branch_id}/summary
  api/v1/forecast.py : get_branch_forecast_summary()   dòng 128
    └── deps.verify_branch_access(branch_id, tenant, db)
          api/deps.py                                   dòng 36
          → Kiểm tra branch thuộc tenant trong bảng branches
    └── db.execute(SQL)
          → SELECT DISTINCT ON (ingredient_id) stockout_date
            FROM forecast_results
            JOIN ai_series_registry WHERE branch_id::text = :branch_id
              AND forecast_date = :today
    └── stock_calculator.get_urgency(row.stockout_date)
          utils/stock_calculator.py                     dòng 122
          → Đếm số lượng theo urgent / warning / ok
```

---

### 3b. Chi tiết dự báo toàn chi nhánh

```
GET /api/v1/forecast/{branch_id}
Authorization: Bearer <token>
Cache-Control: max-age=300   (response được cache 5 phút)

Response 200:
{
  "branch_id": "a7fc4472-...",
  "branch_name": "SKT T1",
  "generated_at": "2026-04-16T09:51:31",
  "last_trained_at": "2026-04-15T17:27:35Z",
  "urgent_count": 0,
  "warning_count": 0,
  "ingredients": [
    {
      "ingredient_id": "a2f3d5be-...",
      "ingredient_name": "Bột ca cao",
      "unit": "g",
      "current_stock": 1561.4,
      "forecast_days": [
        {"forecast_date": "2026-04-16", "predicted_qty": 155.71},
        {"forecast_date": "2026-04-17", "predicted_qty": 124.33},
        ...  // 7 ngày
      ],
      "stockout_date": null,          // null = đủ dùng trong 7 ngày
      "suggested_order_qty": 1009.79, // nên nhập thêm bao nhiêu
      "suggested_order_date": "2026-05-16",
      "urgency": "ok",                // ok | warning | critical
      "is_fallback": false            // true = dùng avg thay vì model
    },
    ...
  ]
}
```

**Call stack:**
```
GET /api/v1/forecast/{branch_id}
  api/v1/forecast.py : get_branch_forecast()            dòng 215
    │
    ├─ deps.verify_branch_access(branch_id, tenant, db)
    │    api/deps.py                                     dòng 36
    │    → SELECT 1 FROM branches WHERE id::text = :branch_id AND tenant_id = :tenant_id
    │
    ├─ model_io.get_train_metadata(tenant.tenant_id)
    │    utils/model_io.py                               dòng 138
    │    → Đọc storage/models/{tenant_id}/train_metadata.json
    │    → Lấy last_trained_at
    │
    ├─ db.execute(SQL: SELECT name FROM branches WHERE id = :branch_id)
    │    → Lấy branch_name
    │
    ├─ db.execute(_SQL_BRANCH_FORECAST)
    │    api/v1/forecast.py                              dòng 31
    │    → SELECT ingredient_id, ingredient_name, unit,
    │             forecast_date, predicted_qty, stockout_date, suggested_qty,
    │             COALESCE(inventory_balances.quantity, 0) AS current_stock
    │      FROM forecast_results
    │      JOIN ai_series_registry  ON asr.id = fr.series_id
    │      JOIN items               ON i.id::text = asr.ingredient_id::text
    │      LEFT JOIN inventory_balances ON ...
    │      WHERE asr.branch_id::text = :branch_id
    │        AND fr.forecast_date >= :today
    │      ORDER BY i.name, fr.forecast_date
    │
    └─ _rows_to_ingredient_forecasts(rows)
         api/v1/forecast.py                              dòng 78
         → Nhóm rows theo ingredient_id
         → Gọi stock_calculator.calc_suggested_order_date()   dòng 92
         → Gọi stock_calculator.get_urgency()                 dòng 122
         → Trả về list[IngredientForecast]
```

---

### 3c. Dự báo 1 nguyên liệu cụ thể

```
GET /api/v1/forecast/{branch_id}/{ingredient_id}
Authorization: Bearer <token>

Response 200: IngredientForecast (cùng schema với 1 phần tử trong 3b)
Response 404: Không có dự báo cho nguyên liệu này
```

**Call stack:**
```
GET /api/v1/forecast/{branch_id}/{ingredient_id}
  api/v1/forecast.py : get_ingredient_forecast()        dòng 177
    ├─ deps.verify_branch_access()
    └─ db.execute(_SQL_INGREDIENT_FORECAST)
         api/v1/forecast.py                             dòng 54
         → Tương tự _SQL_BRANCH_FORECAST nhưng thêm:
           AND asr.ingredient_id::text = :ingredient_id
```

---

## Urgency Logic

| `stockout_date` | `urgency` | Hiển thị |
|---|---|---|
| `None` | `ok` | Đủ dùng trong 7 ngày tới |
| ≤ 2 ngày nữa | `critical` | Cần nhập **ngay hôm nay** |
| ≤ 5 ngày nữa | `warning` | Nên đặt hàng sớm |
| > 5 ngày nữa | `ok` | Bình thường |

> Code: `utils/stock_calculator.py : get_urgency()` dòng 122

---

## Timeline vận hành

```
Chủ nhật 02:00   → [CRON] scheduler/jobs.py : train_all_tenants()          dòng 21
                            → train_service.run_train_all_tenants()
                            → Lưu global_model.np + train_metadata.json

Hàng đêm 00:30   → [CRON] scheduler/jobs.py : predict_all_branches()       dòng 49
                            → predict_service.predict_all_branches()
                            → Cập nhật toàn bộ bảng forecast_results

Hàng ngày 06:00  → [CRON] scheduler/jobs.py : fetch_weather_all()           dòng 73
                            → weather_service.fetch_all_branches_weather()
                            → Cache thời tiết (dùng làm regressor tương lai)

Khi FE load page → GET /api/v1/forecast/{branch_id}/summary   (~10ms)
Khi user click   → GET /api/v1/forecast/{branch_id}            (~50ms)
Khi cần chi tiết → GET /api/v1/forecast/{branch_id}/{ingredient_id}
```

---

## Fallback khi chưa có model

Nếu tenant chưa train hoặc model load thất bại:

```
predict_service.py : predict_branch()         dòng 147
  model_io.model_exists() → False
    └─ _build_fallback_forecast(history_df)   dòng 33
         → avg_daily = trung bình 7 ngày tiêu thụ gần nhất
         → forecast_df: 7 ngày tương lai, mỗi ngày = avg_daily
         → is_fallback = True (hiển thị ở response API)
```

---

## Danh sách bảng DB liên quan

| Bảng | Chủ sở hữu | Mục đích |
|---|---|---|
| `ai_series_registry` | AI service | Map (ingredient_id, branch_id) → integer series_id |
| `forecast_results` | AI service | Kết quả dự báo — FE/BE đọc từ đây |
| `train_logs` | AI service | Lịch sử train, MAE, status |
| `branches` | BE Spring Boot | Kiểm tra branch thuộc tenant |
| `items` | BE Spring Boot | Lấy tên và đơn vị nguyên liệu |
| `inventory_balances` | BE Spring Boot | Tồn kho hiện tại |
| `consumption_history` | AI service | Lịch sử tiêu thụ đã được chuẩn hóa |


3079.4
  