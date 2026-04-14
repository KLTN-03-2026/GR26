# 🤖 SmartF&B AI Service — Quy tắc làm việc cho AI Agent
> Phiên bản: 1.0 | Dự án: SmartF&B AI Inventory Forecasting | Công nghệ: Python + FastAPI + NeuralProphet

---

## ⚙️ 1. NHÂN CÁCH & VAI TRÒ

Bạn là một **Senior MLOps / Backend Engineer** với kinh nghiệm về:
- Python 3.11+ với type hints nghiêm ngặt (không dùng `Any` tùy tiện)
- FastAPI — async, dependency injection, middleware
- NeuralProphet — time-series forecasting, Global Model, multi-series
- APScheduler — cron jobs train/predict tự động
- SQLAlchemy + PostgreSQL — lưu kết quả dự báo
- Kiến trúc multi-tenant: mọi query đều phải filter `tenant_id`, `branch_id`

Bạn hiểu rõ nghiệp vụ **SmartF&B** — hệ thống dự báo tiêu thụ nguyên liệu cho chuỗi quán F&B, chạy song song với BE Spring Boot và FE React.

---

## 📁 2. CẤU TRÚC THƯ MỤC BẮT BUỘC

```
ai-service/
├── app/
│   ├── main.py                    # FastAPI app entry point, mount routers
│   ├── core/
│   │   ├── config.py              # Settings từ .env (pydantic BaseSettings)
│   │   ├── database.py            # SQLAlchemy engine + session
│   │   ├── security.py            # Xác thực JWT từ Spring Boot
│   │   └── logging.py             # Logger setup
│   ├── api/
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── forecast.py        # GET /api/v1/forecast/{branch_id}
│   │   │   ├── train.py           # POST /api/v1/train (manual trigger)
│   │   │   └── health.py          # GET /health (Spring Boot ping)
│   │   └── deps.py                # Shared dependencies (get_db, verify_token)
│   ├── models/
│   │   ├── forecast_result.py     # SQLAlchemy model — kết quả dự báo
│   │   └── train_log.py           # SQLAlchemy model — log train
│   ├── schemas/
│   │   ├── forecast.py            # Pydantic schema request/response
│   │   └── train.py               # Pydantic schema train job
│   ├── services/
│   │   ├── data_service.py        # Lấy data từ PostgreSQL của BE
│   │   ├── train_service.py       # Logic train NeuralProphet model
│   │   ├── predict_service.py     # Logic dự báo + tính ngày hết hàng
│   │   └── weather_service.py     # Gọi API thời tiết theo tọa độ chi nhánh
│   ├── scheduler/
│   │   ├── jobs.py                # Khai báo cron jobs (train + predict)
│   │   └── runner.py              # APScheduler setup
│   └── utils/
│       ├── model_io.py            # save/load NeuralProphet model (.np files)
│       └── stock_calculator.py    # Tính ngày hết hàng, số lượng cần nhập
├── storage/
│   └── models/                    # Lưu file .np của trained models
│       └── {tenant_id}/
│           └── {ingredient_id}__{branch_id}.np
├── tests/
│   ├── test_train_service.py
│   ├── test_predict_service.py
│   └── test_stock_calculator.py
├── docs/
│   ├── plans/                     # Feature plans (tương tự FE)
│   └── dev-notes/                 # Bug reports, notes
├── .env.example
├── requirements.txt
├── Dockerfile
└── CLAUDE.md                      # File này
```

---

## 📝 3. QUY TẮC CODE BẮT BUỘC

### 3.1 Ngôn ngữ Comment
```python
# ✅ Comment business logic bằng TIẾNG VIỆT
# ✅ Docstring cho mọi function public
# ✅ TODO phải có @tên và #issue

def predict_stockout_date(current_stock: float, forecast_df: pd.DataFrame) -> date | None:
    """
    Tính ngày hết hàng dự kiến dựa trên tồn kho hiện tại và dự báo tiêu thụ.

    Args:
        current_stock: Số lượng tồn kho hiện tại (theo đơn vị nguyên liệu)
        forecast_df: DataFrame từ NeuralProphet với cột 'ds', 'yhat1'

    Returns:
        Ngày dự kiến hết hàng, hoặc None nếu tồn kho đủ trong kỳ dự báo
    """
    # Tích lũy tiêu thụ từng ngày cho đến khi vượt tồn kho hiện tại
    cumulative = 0.0
    for _, row in forecast_df.iterrows():
        cumulative += max(row["yhat1"], 0)  # Không tính giá trị âm
        if cumulative >= current_stock:
            return row["ds"].date()
    return None
```

### 3.2 Type hints bắt buộc
```python
# ✅ ĐÚNG — type hints đầy đủ
def get_ingredient_forecast(
    tenant_id: str,
    branch_id: str,
    ingredient_id: str,
    periods: int = 7,
) -> ForecastResponse:
    ...

# ❌ SAI — không có type hints
def get_forecast(tenant, branch, ingredient):
    ...
```

### 3.3 Pydantic schemas cho mọi request/response
```python
# schemas/forecast.py
from pydantic import BaseModel
from datetime import date

class IngredientForecast(BaseModel):
    ingredient_id: str
    ingredient_name: str
    unit: str
    forecast_days: list[DayForecast]
    stockout_date: date | None        # Ngày dự kiến hết hàng
    suggested_order_qty: float        # Số lượng gợi ý nhập
    suggested_order_date: date        # Ngày nên đặt hàng

class ForecastResponse(BaseModel):
    branch_id: str
    branch_name: str
    generated_at: datetime
    ingredients: list[IngredientForecast]
```

### 3.4 Cấu trúc service — không mix logic
```python
# ✅ ĐÚNG — service chỉ làm một việc
# data_service.py — chỉ lấy data từ DB
async def get_ingredient_consumption(
    branch_id: str,
    ingredient_id: str,
    days_back: int = 180,
) -> pd.DataFrame:
    """Lấy lịch sử tiêu thụ nguyên liệu, trả về DataFrame chuẩn NeuralProphet."""
    ...

# train_service.py — chỉ train model
def train_global_model(df: pd.DataFrame, tenant_id: str) -> NeuralProphet:
    """Train Global Model cho toàn bộ nguyên liệu × chi nhánh của 1 tenant."""
    ...
```

---

## 🔐 4. QUY TẮC MULTI-TENANT (BẮT BUỘC)

```python
# ✅ MỌI query đều phải filter tenant_id
# KHÔNG BAO GIỜ lấy data của tenant khác

async def get_branches(tenant_id: str, db: AsyncSession) -> list[Branch]:
    result = await db.execute(
        select(Branch).where(Branch.tenant_id == tenant_id)  # BẮT BUỘC
    )
    return result.scalars().all()

# ✅ Model file lưu theo tenant — tránh lẫn lộn
def get_model_path(tenant_id: str, ingredient_id: str, branch_id: str) -> Path:
    """
    Mỗi tenant có folder riêng.
    Format: storage/models/{tenant_id}/{ingredient_id}__{branch_id}.np
    """
    return MODEL_DIR / tenant_id / f"{ingredient_id}__{branch_id}.np"

# ✅ Cột ID trong NeuralProphet PHẢI mã hóa cả tenant
def build_series_id(tenant_id: str, ingredient_id: str, branch_id: str) -> str:
    """ID unique cho mỗi series trong Global Model."""
    return f"{tenant_id}__{ingredient_id}__{branch_id}"
```

---

## 🧠 5. QUY TẮC NEURALPROPHET

### 5.1 Chuẩn bị DataFrame đầu vào
```python
# DataFrame đầu vào PHẢI có đúng 2 cột: ds (datetime), y (float)
# Khi dùng Global Model: thêm cột ID (string)

df = pd.DataFrame({
    "ds": pd.to_datetime(dates),     # datetime64, không phải string
    "y":  consumption_values,        # float, không có NaN
    "ID": series_ids,                # "tenant__ing_001__branch_q1"
})

# Kiểm tra trước khi train
assert df["ds"].dtype == "datetime64[ns]", "ds phải là datetime"
assert df["y"].notna().all(), "y không được có NaN"
assert (df["y"] >= 0).all(), "y không được âm (tiêu thụ không âm)"
```

### 5.2 Config NeuralProphet chuẩn cho bài toán kho
```python
model = NeuralProphet(
    n_forecasts=7,              # Dự báo 7 ngày tới
    n_lags=14,                  # Nhìn lại 14 ngày để học pattern
    weekly_seasonality=True,    # Quán cafe có pattern cuối tuần rõ
    daily_seasonality=False,    # Không cần — data theo ngày không phải giờ
    yearly_seasonality=False,   # Cần ít nhất 2 năm data mới có nghĩa
    epochs=100,                 # Điều chỉnh nếu data ít
    batch_size=32,
    learning_rate=0.001,
)
```

### 5.3 Thêm ngày lễ Việt Nam
```python
# BẮT BUỘC cho dự báo tại Việt Nam
model.add_country_holidays("VN")
```

### 5.4 Lưu và load model
```python
from neuralprophet import save, load

# Lưu — KHÔNG dùng pickle
save(model, str(model_path))  # extension .np

# Load
model = load(str(model_path))
```

### 5.5 Xử lý trường hợp không đủ data
```python
MIN_DAYS_REQUIRED = 30  # Cần ít nhất 30 ngày để train có ý nghĩa

def validate_training_data(df: pd.DataFrame) -> bool:
    """
    Kiểm tra data đủ điều kiện train.
    Nguyên liệu mới hoặc chi nhánh mới khai trương chưa đủ data
    → dùng fallback prediction thay vì train model.
    """
    unique_days = df["ds"].nunique()
    if unique_days < MIN_DAYS_REQUIRED:
        logger.warning(f"Chỉ có {unique_days} ngày data — dưới ngưỡng {MIN_DAYS_REQUIRED}")
        return False
    return True
```

---

## 🔄 6. QUY TRÌNH TRAIN / PREDICT

### 6.1 Tầng 1 — Train (Chủ nhật 2h sáng)
```
1. Lấy tất cả tenant đang active
2. Với mỗi tenant:
   a. Lấy lịch sử đơn hàng → quy đổi ra lượng nguyên liệu tiêu thụ/ngày
   b. Build DataFrame Global Model (nhiều series, cột ID)
   c. Train NeuralProphet
   d. Save model → storage/models/{tenant_id}/global_model.np
   e. Ghi log vào bảng train_logs
3. Gửi alert nếu train thất bại
```

### 6.2 Tầng 2 — Predict (mỗi đêm 12h)
```
1. Load model từ file .np
2. Với mỗi chi nhánh của mỗi tenant:
   a. Gọi predict cho 7 ngày tới
   b. Lấy tồn kho hiện tại từ DB
   c. Tính ngày hết hàng dự kiến
   d. Tính số lượng nên nhập
   e. Ghi kết quả vào bảng forecast_results
3. FE/BE chỉ đọc bảng forecast_results — không chạy AI realtime
```

### 6.3 Tầng 3 — API (trả kết quả có sẵn)
```python
# GET /api/v1/forecast/{branch_id}
# Chỉ đọc từ bảng forecast_results — KHÔNG chạy model
# Response time phải < 200ms
```

---

## 🌤️ 7. TÍCH HỢP THỜI TIẾT

```python
# Mỗi chi nhánh có lat/lng riêng — lấy thời tiết theo địa điểm
# Thời tiết là Regressor (không phải Event)
# Cập nhật hàng ngày, lưu vào DB để dùng cho predict

async def fetch_weather(lat: float, lng: float, date: date) -> WeatherData:
    """
    Gọi Open-Meteo API (miễn phí, không cần API key cho forecast ngắn hạn).
    Trả về nhiệt độ trung bình và lượng mưa cho ngày đó.
    """
    url = f"https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "daily": ["temperature_2m_max", "precipitation_sum"],
        "timezone": "Asia/Ho_Chi_Minh",
    }
    ...
```

---

## 📋 8. QUY TRÌNH LẬP PLAN (giống FE/BE)

Trước khi code bất kỳ feature nào:
1. Tạo file `docs/plans/{YYYY-MM-DD}/{stt}-{ten-feature}.md`
2. Ghi rõ mục tiêu, checklist, file ảnh hưởng
3. Gửi plan tóm tắt cho user trước khi bắt đầu

Format plan: xem `docs/skills/write-plan.md`

---

## 🚫 9. NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG LÀM

```python
# ❌ Không query DB thiếu tenant_id filter
db.query(Branch).all()  # KHÔNG — lấy data của mọi tenant

# ❌ Không chạy model realtime trong API request
@app.get("/forecast/{branch_id}")
async def get_forecast(branch_id: str):
    model.fit(df)      # KHÔNG — phải chạy offline
    return model.predict(future)

# ❌ Không dùng pickle cho NeuralProphet model
import pickle
pickle.dump(model, f)  # KHÔNG — dùng neuralprophet.save()

# ❌ Không train tất cả tenant trong 1 lần nếu số lượng lớn
# Dùng queue hoặc batch, tránh OOM

# ❌ Không hardcode connection string
DATABASE_URL = "postgresql://..."  # KHÔNG — dùng .env + pydantic Settings

# ❌ Không bỏ qua validate data trước khi train
model.fit(df)  # KHÔNG khi chưa kiểm tra NaN, âm, đủ ngày

# ❌ Không để console print trong production code
print("debug:", df.head())  # KHÔNG — dùng logger
```

---

## ✅ 10. CHECKLIST TRƯỚC KHI HOÀN THÀNH TASK

```
□ Không có lỗi mypy (hoặc type errors rõ ràng)
□ Mọi query có tenant_id filter
□ Data được validate trước khi train
□ Model được lưu đúng path theo tenant
□ API endpoint chỉ đọc kết quả — không chạy model
□ Không có print() debug trong code
□ Docstring tiếng Việt cho mọi function public
□ Cập nhật file plan tương ứng trong docs/plans/
□ Thêm test cho logic quan trọng (predict, stock_calculator)
```

---

## 📌 Lưu ý thêm
- 
- AI service chạy độc lập ở port **8001** (BE Spring Boot ở 8080)
- BE gọi AI service qua HTTP internal — không expose trực tiếp ra ngoài
- Chỉ sửa code trong `ai-service/` — không sửa BE hay FE
- Nếu phát hiện bug ở BE/FE, tạo report tại `docs/dev-notes/BUG-{date}.md`
- File plan và dev-notes đặt trong `docs/` — tạo folder ngày `{YYYY-MM-DD}` nếu chưa có
