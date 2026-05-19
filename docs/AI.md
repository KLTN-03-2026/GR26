# 🤖 Tích hợp AI Quản lý Kho với NeuralProphet

## Tổng quan

Tài liệu này mô tả chi tiết các bước tích hợp AI (NeuralProphet) để dự báo nhu cầu và tối ưu hóa quản lý kho cho hệ thống SmartF&B.

**NeuralProphet** là thư viện dự báo chuỗi thời gian dựa trên PyTorch, kết hợp ưu điểm của Facebook Prophet và Deep Learning.

---

## 🧠 NeuralProphet - Giải thích Chi tiết

### Có cần Train trước không?

**Có**, NeuralProphet cần train trên dữ liệu lịch sử trước khi predict:

| Yêu cầu | Giá trị |
|---------|---------|
| **Minimum data** | 30 ngày (recommend 90+ ngày) |
| **Train time** | ~10-30 giây/item (100 epochs) |
| **Online learning** | Có thể update model khi có data mới |

---

### Data Vào (Input Format)

NeuralProphet yêu cầu **ĐÚNG 2 columns**:
- `ds`: datetime (ngày)
- `y`: giá trị cần dự báo (số lượng tiêu thụ)

```python
import pandas as pd

# VÍ DỤ: Data tiêu thụ "Espresso" 30 ngày qua
data = pd.DataFrame({
    "ds": ["2026-03-01", "2026-03-02", "2026-03-03", ...],
    "y":  [1800, 1950, 1720, 2100, 1880, ...]  # ml tiêu thụ mỗi ngày
})
```

---

### Cách Sử dụng Cơ bản

```python
from neuralprophet import NeuralProphet

# 1. Khởi tạo model
model = NeuralProphet(
    n_forecasts=14,           # Dự báo 14 ngày tới
    n_lags=7,                 # Dùng 7 ngày trước để predict (Auto-regression)
    yearly_seasonality=True,  # Pattern theo năm (Tết, mùa hè, etc.)
    weekly_seasonality=True,  # Pattern theo tuần (weekend effect)
)

# 2. Train model
model.fit(data, freq="D")  # freq="D" = daily data

# 3. Tạo future dates để predict
future = model.make_future_dataframe(data, periods=14)

# 4. Predict
forecast = model.predict(future)
```

---

### Data Ra (Output Format)

```python
# forecast DataFrame có các columns:
print(forecast[["ds", "yhat1", "trend", "season_weekly"]])

# Output:
#          ds     yhat1    trend   season_weekly
# 0  2026-04-01   1850.5   1800.0    50.5
# 1  2026-04-02   1920.3   1802.0   118.3
# 2  2026-04-03   1780.1   1804.0   -23.9
# ...

# Giải thích columns:
# - ds: ngày
# - yhat1: giá trị dự báo (ngày tiếp theo)
# - yhat2...yhat14: dự báo 2-14 ngày tới (nếu n_forecasts > 1)
# - trend: xu hướng dài hạn
# - season_weekly: pattern tuần (thứ 7-CN cao hơn?)
# - season_yearly: pattern năm (Tết, mùa hè?)
```

---

### 📌 Ví dụ Cụ thể: Input → Output → Ý nghĩa

**Tình huống:** Quán cà phê muốn dự báo lượng Espresso cần cho 7 ngày tới

#### 🔹 INPUT (Dữ liệu đầu vào):
```python
# Lịch sử tiêu thụ Espresso 30 ngày qua (ml/ngày)
data = pd.DataFrame({
    "ds": pd.date_range("2026-03-01", periods=30, freq="D"),
    "y": [1800, 1950, 1720, 2100, 1880, 2200, 2350,   # Tuần 1 (T2-CN)
          1750, 1900, 1680, 2050, 1900, 2150, 2400,   # Tuần 2
          1820, 1980, 1750, 2120, 1950, 2250, 2380,   # Tuần 3
          1780, 1920, 1700, 2080, 1870, 2180, 2320,   # Tuần 4
          1850, 1960]                                   # 2 ngày đầu tuần 5
})
```

#### 🔹 OUTPUT (Kết quả dự báo):
```python
# Sau khi train và predict
forecast = model.predict(future)

# Kết quả dự báo 7 ngày tới:
#          ds       yhat1    trend    season_weekly
# 0  2026-04-01   1712.3   1850.0      -137.7      # Thứ 4 (thấp)
# 1  2026-04-02   2085.5   1852.0       233.5      # Thứ 5 (cao hơn)
# 2  2026-04-03   1892.1   1854.0        38.1      # Thứ 6 (trung bình)
# 3  2026-04-04   2195.8   1856.0       339.8      # Thứ 7 (CAO - cuối tuần)
# 4  2026-04-05   2348.2   1858.0       490.2      # Chủ nhật (RẤT CAO)
# 5  2026-04-06   1768.4   1860.0       -91.6      # Thứ 2 (thấp trở lại)
# 6  2026-04-07   1923.7   1862.0        61.7      # Thứ 3 (trung bình)
```

#### 🔹 Ý NGHĨA của từng cột:

| Cột | Ý nghĩa | Ví dụ giải thích |
|-----|---------|------------------|
| `ds` | Ngày dự báo | 2026-04-01 là ngày cần dự báo |
| `yhat1` | **Giá trị dự báo cuối cùng** (ml Espresso cần) | 1712.3 ml → cần ~1.7 lít Espresso ngày đó |
| `trend` | Xu hướng dài hạn (tăng/giảm qua thời gian) | 1850→1862: tăng nhẹ ~0.5%/tuần |
| `season_weekly` | Pattern tuần (ảnh hưởng của ngày trong tuần) | +490.2 (CN) vs -137.7 (T4): CN bán gấp đôi thứ 4 |

#### 🔹 Cách ĐỌC HIỂU kết quả:

```
yhat1 = trend + season_weekly (+ các thành phần khác)

Ví dụ Chủ nhật (2026-04-05):
  yhat1 = 2348.2 ml
  trend = 1858.0 (xu hướng cơ bản)
  season_weekly = +490.2 (cuối tuần đông khách)
  
  → Giải thích: Chủ nhật cần 2.35 lít Espresso vì:
    - Xu hướng cơ bản ~1.86 lít
    - Cuối tuần thêm ~0.49 lít (+26%)
```

#### 🔹 Hành động từ dự báo:

```
📊 Tổng dự báo 7 ngày: 1712 + 2086 + 1892 + 2196 + 2348 + 1768 + 1924 = 13,926 ml ≈ 14 lít

📦 Tồn kho hiện tại: 5 lít Espresso

⚠️ ALERT: Thiếu 14 - 5 = 9 lít Espresso cho tuần tới!
   → Đặt hàng thêm ít nhất 10 lít để có buffer an toàn
```

---

### Chiến lược: Train theo NGUYÊN LIỆU, không theo MÓN

**Với 10 món + 30 nguyên liệu → Chỉ cần 30 models**

```
┌─────────────────────────────────────────────────────────────┐
│  FLOW: Order → Recipe → Nguyên liệu tiêu thụ               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Món bán]              [Recipe]              [Nguyên liệu] │
│                                                             │
│  Cà phê sữa ─────────► 20ml espresso ────────► Espresso    │
│       │                 30ml sữa đặc ─────────► Sữa đặc    │
│       │                 150ml sữa tươi ───────► Sữa tươi   │
│                                                             │
│  Cappuccino ─────────► 30ml espresso ────────► Espresso    │
│       │                 200ml sữa tươi ───────► Sữa tươi   │
│                                                             │
│  Latte ──────────────► 30ml espresso ────────► Espresso    │
│                         250ml sữa tươi ───────► Sữa tươi   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Kết quả:
→ Espresso được dùng bởi 3 món → Train 1 model cho Espresso
→ Sữa tươi được dùng bởi 3 món → Train 1 model cho Sữa tươi  
→ Sữa đặc chỉ dùng bởi 1 món  → Train 1 model cho Sữa đặc

✅ 30 nguyên liệu = 30 models (KHÔNG PHẢI 10 models cho 10 món)
```

---

### Code Thực tế cho SmartF&B

```python
class InventoryForecaster:
    """
    Dự báo cho 30 nguyên liệu từ lịch sử bán 10 món.
    """
    
    def __init__(self):
        self.models = {}  # {ingredient_id: trained_model}
    
    def calculate_ingredient_usage(self, orders_df, recipes_df):
        """
        Bước 1: Tính tiêu thụ nguyên liệu từ đơn hàng.
        
        INPUT - orders_df:
        | date       | item_id        | qty_sold |
        |------------|----------------|----------|
        | 2026-03-01 | Cà phê sữa     | 45       |
        | 2026-03-01 | Cappuccino     | 30       |
        
        INPUT - recipes_df:
        | item_id    | ingredient_id  | quantity_per_unit |
        |------------|----------------|-------------------|
        | Cà phê sữa | Espresso       | 20 (ml)           |
        | Cà phê sữa | Sữa đặc        | 30 (ml)           |
        | Cappuccino | Espresso       | 30 (ml)           |
        
        OUTPUT:
        | date       | ingredient_id  | total_usage |
        |------------|----------------|-------------|
        | 2026-03-01 | Espresso       | 1800 (ml)   |  # 45×20 + 30×30
        | 2026-03-01 | Sữa đặc        | 1350 (ml)   |  # 45×30
        """
        # Join orders với recipes
        usage = orders_df.merge(recipes_df, on="item_id")
        usage["total_usage"] = usage["qty_sold"] * usage["quantity_per_unit"]
        
        # Group by date + ingredient
        daily_usage = usage.groupby(["date", "ingredient_id"])["total_usage"].sum().reset_index()
        
        return daily_usage
    
    def train_all_ingredients(self, daily_usage_df):
        """
        Bước 2: Train 1 model cho mỗi nguyên liệu (30 models).
        """
        ingredients = daily_usage_df["ingredient_id"].unique()
        
        for ingredient_id in ingredients:
            # Lọc data cho nguyên liệu này
            data = daily_usage_df[daily_usage_df["ingredient_id"] == ingredient_id]
            data = data.rename(columns={"date": "ds", "total_usage": "y"})
            
            if len(data) < 30:
                print(f"⚠️ Skip {ingredient_id}: chưa đủ 30 ngày data")
                continue
            
            # Train model
            model = NeuralProphet(
                n_forecasts=14,
                n_lags=7,
                yearly_seasonality=True,
                weekly_seasonality=True,
            )
            model.add_country_holidays(country_name="VN")  # Ngày lễ VN
            model.fit(data[["ds", "y"]], freq="D")
            
            self.models[ingredient_id] = model
            print(f"✓ Trained model for: {ingredient_id}")
    
    def predict_all(self, current_data_df):
        """
        Bước 3: Dự báo 14 ngày cho tất cả nguyên liệu.
        
        OUTPUT:
        {
            "Espresso": [
                {"date": "2026-04-01", "predicted": 1850.5},
                {"date": "2026-04-02", "predicted": 1920.3},
                ...
            ],
            "Sữa đặc": [...],
            ...
        }
        """
        predictions = {}
        
        for ingredient_id, model in self.models.items():
            data = current_data_df[current_data_df["ingredient_id"] == ingredient_id]
            data = data.rename(columns={"date": "ds", "total_usage": "y"})
            
            future = model.make_future_dataframe(data, periods=14)
            forecast = model.predict(future)
            
            # Lấy 14 ngày tới (future only)
            future_only = forecast[forecast["ds"] > data["ds"].max()]
            
            predictions[ingredient_id] = [
                {
                    "date": row["ds"].strftime("%Y-%m-%d"), 
                    "predicted": round(row["yhat1"], 2)
                }
                for _, row in future_only.iterrows()
            ]
        
        return predictions
    
    def check_stockout_risk(self, predictions, current_stock):
        """
        Bước 4: Kiểm tra nguy cơ hết hàng.
        
        INPUT - current_stock:
        {"Espresso": 5000, "Sữa đặc": 3000, ...}  # ml
        
        OUTPUT:
        [
            {"ingredient": "Sữa đặc", "days_until_stockout": 3, "action": "ORDER_NOW"},
            {"ingredient": "Espresso", "days_until_stockout": 8, "action": "PLAN_ORDER"},
        ]
        """
        alerts = []
        
        for ingredient_id, daily_predictions in predictions.items():
            stock = current_stock.get(ingredient_id, 0)
            cumulative = 0
            
            for i, day in enumerate(daily_predictions):
                cumulative += day["predicted"]
                if cumulative >= stock:
                    days = i + 1
                    alerts.append({
                        "ingredient": ingredient_id,
                        "current_stock": stock,
                        "days_until_stockout": days,
                        "action": "ORDER_NOW" if days <= 3 else "PLAN_ORDER",
                        "suggested_order": round(cumulative * 1.2, 2)  # +20% buffer
                    })
                    break
        
        return sorted(alerts, key=lambda x: x["days_until_stockout"])
```

---

### Tổng quan Flow xử lý

```
┌────────────────────────────────────────────────────────────────────┐
│                   DAILY CRON JOB (2:00 AM)                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. FETCH DATA từ Database                                         │
│     ├─► daily_item_stats: số lượng món bán mỗi ngày               │
│     └─► recipes: công thức nguyên liệu cho mỗi món                │
│                                                                    │
│  2. CALCULATE INGREDIENT USAGE                                     │
│     └─► orders × recipes = daily ingredient consumption           │
│         VD: 45 ly cà phê sữa × 20ml espresso = 900ml espresso     │
│                                                                    │
│  3. TRAIN/UPDATE 30 MODELS (1 per nguyên liệu)                    │
│     └─► NeuralProphet.fit() cho mỗi nguyên liệu                   │
│         Train time: ~30 giây × 30 = ~15 phút total                │
│                                                                    │
│  4. PREDICT 14 DAYS cho mỗi nguyên liệu                           │
│     └─► model.predict() → {Espresso: [d1, d2, ...d14], ...}       │
│                                                                    │
│  5. CHECK STOCKOUT RISK                                            │
│     └─► So sánh predicted_usage vs inventory_balances             │
│         → Tính ngày còn lại trước khi hết hàng                    │
│                                                                    │
│  6. GENERATE INSIGHTS & SAVE TO DB                                 │
│     └─► INSERT INTO ai_insights                                   │
│         (type='LOW_STOCK_FORECAST', item_id, data, ...)           │
│                                                                    │
│  7. FRONTEND HIỂN THỊ ALERTS                                       │
│     └─► "⚠️ Sữa đặc còn 3 ngày. Đề xuất nhập 5kg"                 │
│     └─► Chart dự báo 14 ngày                                      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Bảng Tóm tắt

| Câu hỏi | Trả lời |
|---------|---------|
| **Cần train trước?** | Có, minimum 30 ngày data |
| **Data vào?** | DataFrame với 2 columns: `ds` (date), `y` (quantity) |
| **Data ra?** | DataFrame với `ds`, `yhat1` (predicted), `trend`, `seasonality` |
| **Train theo gì?** | Theo **nguyên liệu**, KHÔNG theo món |
| **Số models?** | 30 models cho 30 nguyên liệu |
| **Khi nào train?** | Cron job 2:00 AM hàng ngày |
| **Train bao lâu?** | ~10-30 giây/model → ~15 phút cho 30 models |

---

## 📊 Phân tích Hiện trạng

### Đã có sẵn (Schema DB)
| Component | Status | Ghi chú |
|-----------|--------|---------|
| `items` table | ✅ | Unified item (SELLABLE, INGREDIENT, SUB_ASSEMBLY) |
| `recipes` table | ✅ | Công thức: item → ingredients |
| `inventory_balances` | ⚠️ Schema only | Tồn kho hiện tại - chưa có Java entity |
| `stock_batches` | ⚠️ Schema only | FIFO tracking - chưa có Java entity |
| `inventory_transactions` | ⚠️ Schema only | Lịch sử xuất/nhập - chưa có Java entity |
| `daily_item_stats` | ⚠️ Schema only | Thống kê bán hàng theo ngày |
| `ai_insights` | ⚠️ Schema only | Lưu kết quả dự báo AI |

### Chưa có
- ❌ Java entities cho inventory
- ❌ REST API inventory
- ❌ Python AI service
- ❌ Migration V6 cho inventory tables

---

## 🚀 Lộ trình Tích hợp (6 Phases)

---

## Phase 1: Hoàn thiện Backend Inventory (Java/Spring Boot)

### 1.1 Tạo Migration V6 cho Inventory Tables

```sql
-- File: V6__inventory_module.sql

-- 1. Bảng tồn kho theo chi nhánh
CREATE TABLE IF NOT EXISTS inventory_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    item_id UUID NOT NULL REFERENCES items(id),
    quantity DECIMAL(10,4) NOT NULL DEFAULT 0,
    min_level DECIMAL(10,4) DEFAULT 0,
    version INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, item_id)
);

-- 2. Bảng lô hàng (FIFO tracking)
CREATE TABLE IF NOT EXISTS stock_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    item_id UUID NOT NULL REFERENCES items(id),
    supplier_id UUID REFERENCES suppliers(id),
    quantity_initial DECIMAL(10,4) NOT NULL,
    quantity_remaining DECIMAL(10,4) NOT NULL,
    cost_per_unit DECIMAL(12,4),
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng giao dịch kho (audit trail)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    item_id UUID NOT NULL REFERENCES items(id),
    user_id UUID REFERENCES users(id),
    batch_id UUID REFERENCES stock_batches(id),
    type VARCHAR(20) NOT NULL, -- IMPORT, EXPORT, SALE_DEDUCT, WASTE, ADJUSTMENT
    quantity DECIMAL(10,4) NOT NULL,
    cost_per_unit DECIMAL(12,4),
    reference_id UUID,
    reference_type VARCHAR(30),
    note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng thống kê bán hàng theo ngày (cho AI training)
CREATE TABLE IF NOT EXISTS daily_item_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    item_id UUID NOT NULL REFERENCES items(id),
    date DATE NOT NULL,
    qty_sold DECIMAL(10,2) DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    cost DECIMAL(12,2) DEFAULT 0,
    UNIQUE(branch_id, item_id, date)
);

-- 5. Bảng lưu insights từ AI
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID REFERENCES branches(id),
    item_id UUID REFERENCES items(id),
    type VARCHAR(30) NOT NULL, -- LOW_STOCK_FORECAST, DEMAND_PREDICTION, PURCHASE_SUGGESTION
    insight_text TEXT NOT NULL,
    data JSONB, -- Dữ liệu chart, predictions
    confidence DECIMAL(5,2), -- Độ tin cậy (%)
    is_acknowledged BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_inventory_branch ON inventory_balances(branch_id, item_id);
CREATE INDEX idx_inventory_low_stock ON inventory_balances(tenant_id, branch_id) 
    WHERE quantity <= min_level;
CREATE INDEX idx_batches_fifo ON stock_batches(branch_id, item_id, imported_at ASC) 
    WHERE quantity_remaining > 0;
CREATE INDEX idx_daily_stats ON daily_item_stats(branch_id, item_id, date DESC);
CREATE INDEX idx_ai_insights_active ON ai_insights(tenant_id, is_acknowledged, created_at DESC);
```

### 1.2 Tạo Java Entities

```
smartfb-backend/src/main/java/com/smartfnb/inventory/
├── domain/
│   ├── entity/
│   │   ├── InventoryBalance.java
│   │   ├── StockBatch.java
│   │   └── InventoryTransaction.java
│   ├── valueobject/
│   │   └── TransactionType.java (enum: IMPORT, EXPORT, SALE_DEDUCT, WASTE, ADJUSTMENT)
│   └── repository/
│       ├── InventoryBalanceRepository.java
│       ├── StockBatchRepository.java
│       └── InventoryTransactionRepository.java
├── application/
│   ├── command/
│   │   ├── ImportStockCommand.java
│   │   ├── DeductStockCommand.java
│   │   └── AdjustStockCommand.java
│   ├── query/
│   │   ├── GetInventoryQuery.java
│   │   └── GetLowStockItemsQuery.java
│   └── dto/
│       ├── InventoryResponse.java
│       └── StockMovementDto.java
├── infrastructure/
│   └── persistence/
│       ├── InventoryBalanceJpaEntity.java
│       ├── InventoryBalanceJpaRepository.java
│       └── ...
└── web/
    └── controller/
        └── InventoryController.java
```

### 1.3 API Endpoints cần tạo

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/inventory/{branchId}` | Danh sách tồn kho |
| GET | `/api/v1/inventory/{branchId}/low-stock` | Items sắp hết hàng |
| POST | `/api/v1/inventory/{branchId}/import` | Nhập kho |
| POST | `/api/v1/inventory/{branchId}/export` | Xuất kho |
| POST | `/api/v1/inventory/{branchId}/adjust` | Điều chỉnh |
| GET | `/api/v1/inventory/{branchId}/history` | Lịch sử giao dịch |
| GET | `/api/v1/inventory/{branchId}/stats` | Thống kê bán hàng (cho AI) |

---

## Phase 2: Xây dựng AI Service (Python)

### 2.1 Cấu trúc Project

```
smartfb-ai/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Config từ env
│   ├── models/
│   │   ├── __init__.py
│   │   ├── demand_forecaster.py    # NeuralProphet model
│   │   └── reorder_optimizer.py    # Logic đề xuất nhập hàng
│   ├── services/
│   │   ├── __init__.py
│   │   ├── data_service.py         # Fetch data từ DB
│   │   ├── prediction_service.py   # Orchestrate predictions
│   │   └── insight_service.py      # Generate insights
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py               # API endpoints
│   └── schemas/
│       ├── __init__.py
│       └── prediction.py           # Pydantic models
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

### 2.2 requirements.txt

```txt
fastapi==0.109.0
uvicorn==0.27.0
neuralprophet==0.8.0
pandas==2.2.0
numpy==1.26.0
psycopg2-binary==2.9.9
sqlalchemy==2.0.25
python-dotenv==1.0.0
httpx==0.26.0
pydantic==2.6.0
```

### 2.3 NeuralProphet Demand Forecaster

```python
# app/models/demand_forecaster.py

from neuralprophet import NeuralProphet
import pandas as pd
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class DemandForecaster:
    """
    Dự báo nhu cầu nguyên liệu sử dụng NeuralProphet.
    
    NeuralProphet kết hợp:
    - Trend decomposition (xu hướng dài hạn)
    - Seasonality (mùa vụ: tuần, tháng, năm)
    - Auto-regression (AR-Net cho short-term patterns)
    - Holiday effects (ngày lễ, sự kiện)
    """
    
    def __init__(
        self,
        forecast_horizon: int = 14,      # Dự báo 14 ngày tới
        seasonality_mode: str = "multiplicative",
        yearly_seasonality: bool = True,
        weekly_seasonality: bool = True,
        daily_seasonality: bool = False,
    ):
        self.forecast_horizon = forecast_horizon
        self.model_config = {
            "seasonality_mode": seasonality_mode,
            "yearly_seasonality": yearly_seasonality,
            "weekly_seasonality": weekly_seasonality,
            "daily_seasonality": daily_seasonality,
            "n_forecasts": forecast_horizon,
            "n_lags": 14,                # Auto-regression: 14 ngày trước
            "learning_rate": 0.1,
            "epochs": 100,
            "batch_size": 32,
        }
        self.models: Dict[str, NeuralProphet] = {}  # Cache models per item
    
    def prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Chuẩn bị data theo format NeuralProphet yêu cầu:
        - 'ds': datetime column
        - 'y': target value (qty_sold)
        
        Args:
            df: DataFrame với columns [date, qty_sold]
        
        Returns:
            DataFrame với columns [ds, y]
        """
        data = df.copy()
        data = data.rename(columns={"date": "ds", "qty_sold": "y"})
        data["ds"] = pd.to_datetime(data["ds"])
        data = data.sort_values("ds")
        
        # Fill missing dates với 0 (không bán)
        date_range = pd.date_range(start=data["ds"].min(), end=data["ds"].max(), freq="D")
        data = data.set_index("ds").reindex(date_range, fill_value=0).reset_index()
        data = data.rename(columns={"index": "ds"})
        
        return data
    
    def train(self, item_id: str, historical_data: pd.DataFrame) -> None:
        """
        Train model cho một item cụ thể.
        
        Args:
            item_id: UUID của item
            historical_data: Data lịch sử bán hàng
        """
        if len(historical_data) < 30:
            logger.warning(f"Item {item_id}: Không đủ data (cần ít nhất 30 ngày)")
            return
        
        data = self.prepare_data(historical_data)
        
        model = NeuralProphet(**self.model_config)
        
        # Thêm Vietnamese holidays (Tết, 30/4, 2/9, etc.)
        model.add_country_holidays(country_name="VN")
        
        # Train
        model.fit(data, freq="D")
        
        # Cache model
        self.models[item_id] = model
        logger.info(f"Trained model for item {item_id}")
    
    def predict(self, item_id: str, historical_data: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        """
        Dự báo nhu cầu cho N ngày tới.
        
        Args:
            item_id: UUID của item
            historical_data: Data để train nếu model chưa có
        
        Returns:
            DataFrame với columns [ds, yhat1, yhat_lower, yhat_upper]
        """
        if item_id not in self.models:
            if historical_data is None:
                raise ValueError(f"No model for item {item_id} and no historical data provided")
            self.train(item_id, historical_data)
        
        model = self.models[item_id]
        data = self.prepare_data(historical_data) if historical_data is not None else None
        
        # Tạo future dataframe
        future = model.make_future_dataframe(
            data, 
            periods=self.forecast_horizon,
            n_historic_predictions=True
        )
        
        # Predict
        forecast = model.predict(future)
        
        # Lấy predictions cho future dates
        forecast = forecast[forecast["ds"] > data["ds"].max()]
        
        return forecast[["ds", "yhat1"]].rename(columns={"yhat1": "predicted_qty"})
    
    def calculate_reorder_point(
        self,
        predicted_demand: pd.DataFrame,
        lead_time_days: int = 3,
        safety_stock_days: int = 2
    ) -> float:
        """
        Tính điểm đặt hàng lại (Reorder Point).
        
        Formula: ROP = (Average Daily Demand × Lead Time) + Safety Stock
        
        Args:
            predicted_demand: Dự báo nhu cầu
            lead_time_days: Thời gian giao hàng từ supplier
            safety_stock_days: Số ngày dự phòng
        
        Returns:
            Reorder point (số lượng)
        """
        avg_daily_demand = predicted_demand["predicted_qty"].mean()
        safety_stock = avg_daily_demand * safety_stock_days
        reorder_point = (avg_daily_demand * lead_time_days) + safety_stock
        
        return round(reorder_point, 2)
    
    def calculate_optimal_order_qty(
        self,
        predicted_demand: pd.DataFrame,
        unit_cost: float,
        holding_cost_rate: float = 0.2,  # 20% of unit cost per year
        ordering_cost: float = 50000,     # Chi phí mỗi lần đặt hàng (VND)
    ) -> float:
        """
        Tính lượng đặt hàng tối ưu (EOQ - Economic Order Quantity).
        
        Formula: EOQ = sqrt((2 × D × S) / H)
        - D: Annual demand
        - S: Ordering cost per order
        - H: Holding cost per unit per year
        
        Args:
            predicted_demand: Dự báo nhu cầu
            unit_cost: Giá mỗi đơn vị
            holding_cost_rate: Tỷ lệ chi phí lưu kho
            ordering_cost: Chi phí mỗi lần đặt hàng
        
        Returns:
            Số lượng đặt hàng tối ưu
        """
        import math
        
        daily_demand = predicted_demand["predicted_qty"].mean()
        annual_demand = daily_demand * 365
        holding_cost = unit_cost * holding_cost_rate
        
        if holding_cost == 0:
            return daily_demand * 30  # Default: đặt hàng 1 tháng
        
        eoq = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost)
        
        return round(eoq, 2)
```

### 2.4 FastAPI Main Application

```python
# app/main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
import logging

from app.models.demand_forecaster import DemandForecaster
from app.services.data_service import DataService
from app.services.insight_service import InsightService

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SmartF&B AI Service",
    description="AI-powered inventory forecasting using NeuralProphet",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
forecaster = DemandForecaster(forecast_horizon=14)
data_service = DataService()
insight_service = InsightService()


# ============ Schemas ============

class ForecastRequest(BaseModel):
    tenant_id: str
    branch_id: str
    item_ids: Optional[List[str]] = None  # None = all items
    horizon_days: int = 14

class ForecastResult(BaseModel):
    item_id: str
    item_name: str
    predictions: List[dict]  # [{date, predicted_qty}]
    reorder_point: float
    optimal_order_qty: float
    current_stock: float
    days_until_stockout: Optional[int]
    confidence: float

class ForecastResponse(BaseModel):
    branch_id: str
    generated_at: str
    forecasts: List[ForecastResult]
    insights: List[dict]


# ============ Endpoints ============

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": "NeuralProphet"}


@app.post("/api/v1/forecast", response_model=ForecastResponse)
async def generate_forecast(request: ForecastRequest):
    """
    Tạo dự báo nhu cầu cho các items của một chi nhánh.
    
    Process:
    1. Fetch historical sales data từ daily_item_stats
    2. Train/update NeuralProphet model per item
    3. Generate predictions cho N ngày tới
    4. Calculate reorder points và optimal order quantities
    5. Generate AI insights (low stock warnings, suggestions)
    """
    try:
        # 1. Fetch data
        items = data_service.get_inventory_items(
            request.tenant_id, 
            request.branch_id,
            request.item_ids
        )
        
        forecasts = []
        
        for item in items:
            # 2. Get historical sales
            history = data_service.get_sales_history(
                request.branch_id,
                item["id"],
                days=90  # 3 months history
            )
            
            if len(history) < 30:
                logger.warning(f"Skipping {item['name']}: insufficient data")
                continue
            
            # 3. Train and predict
            predictions = forecaster.predict(item["id"], history)
            
            # 4. Calculate metrics
            reorder_point = forecaster.calculate_reorder_point(
                predictions,
                lead_time_days=item.get("lead_time", 3)
            )
            
            optimal_qty = forecaster.calculate_optimal_order_qty(
                predictions,
                unit_cost=item.get("cost_per_unit", 10000)
            )
            
            # 5. Calculate days until stockout
            current_stock = item.get("current_qty", 0)
            avg_daily = predictions["predicted_qty"].mean()
            days_until_stockout = int(current_stock / avg_daily) if avg_daily > 0 else None
            
            forecasts.append(ForecastResult(
                item_id=item["id"],
                item_name=item["name"],
                predictions=predictions.to_dict("records"),
                reorder_point=reorder_point,
                optimal_order_qty=optimal_qty,
                current_stock=current_stock,
                days_until_stockout=days_until_stockout,
                confidence=0.85  # TODO: Calculate from model metrics
            ))
        
        # 6. Generate insights
        insights = insight_service.generate_insights(forecasts)
        
        # 7. Save insights to DB
        await insight_service.save_insights(
            request.tenant_id,
            request.branch_id,
            insights
        )
        
        return ForecastResponse(
            branch_id=request.branch_id,
            generated_at=date.today().isoformat(),
            forecasts=forecasts,
            insights=insights
        )
        
    except Exception as e:
        logger.error(f"Forecast error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/insights/{branch_id}")
async def get_insights(branch_id: str, acknowledged: bool = False):
    """Lấy AI insights cho chi nhánh."""
    return await insight_service.get_insights(branch_id, acknowledged)


@app.post("/api/v1/insights/{insight_id}/acknowledge")
async def acknowledge_insight(insight_id: str):
    """Đánh dấu insight đã được xử lý."""
    return await insight_service.acknowledge(insight_id)
```

### 2.5 Dockerfile cho AI Service

```dockerfile
# smartfb-ai/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY app ./app

# Expose port
EXPOSE 8000

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Phase 3: Tích hợp AI Service với Backend

### 3.1 Cập nhật docker-compose.yml

```yaml
# Thêm vào smartfb-backend/docker-compose.yml

  ai-service:
    build:
      context: ../smartfb-ai
      dockerfile: Dockerfile
    container_name: smartfnb-ai
    restart: unless-stopped
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: smartfnb
      DB_USER: smartfnb
      DB_PASS: smartfnb123
    ports:
      - "8000:8000"
    networks:
      - smartfnb-net
    depends_on:
      postgres:
        condition: service_healthy
```

### 3.2 Backend gọi AI Service

```java
// AiInsightService.java

@Service
@RequiredArgsConstructor
public class AiInsightService {
    
    private final WebClient webClient;
    
    @Value("${ai.service.url:http://ai-service:8000}")
    private String aiServiceUrl;
    
    public Mono<ForecastResponse> getForecast(UUID tenantId, UUID branchId) {
        return webClient.post()
            .uri(aiServiceUrl + "/api/v1/forecast")
            .bodyValue(new ForecastRequest(tenantId, branchId, null, 14))
            .retrieve()
            .bodyToMono(ForecastResponse.class);
    }
    
    public Flux<AiInsight> getInsights(UUID branchId) {
        return webClient.get()
            .uri(aiServiceUrl + "/api/v1/insights/" + branchId)
            .retrieve()
            .bodyToFlux(AiInsight.class);
    }
}
```

### 3.3 Scheduled Job để cập nhật dự báo

```java
// AiForecastScheduler.java

@Component
@RequiredArgsConstructor
@Slf4j
public class AiForecastScheduler {
    
    private final AiInsightService aiInsightService;
    private final BranchRepository branchRepository;
    
    // Chạy mỗi ngày lúc 2:00 AM
    @Scheduled(cron = "0 0 2 * * *")
    public void updateDailyForecasts() {
        log.info("Starting daily AI forecast update...");
        
        branchRepository.findAllActive()
            .forEach(branch -> {
                try {
                    aiInsightService.getForecast(branch.getTenantId(), branch.getId())
                        .subscribe(response -> 
                            log.info("Updated forecast for branch: {}", branch.getName())
                        );
                } catch (Exception e) {
                    log.error("Failed to update forecast for branch {}: {}", 
                        branch.getId(), e.getMessage());
                }
            });
    }
}
```

---

## Phase 4: Frontend Dashboard

### 4.1 Components cần tạo

```
smartfb-frontend/src/modules/inventory/
├── components/
│   ├── InventoryDashboard.tsx      # Tổng quan tồn kho
│   ├── ForecastChart.tsx           # Biểu đồ dự báo (Recharts)
│   ├── LowStockAlert.tsx           # Cảnh báo hết hàng
│   ├── AiInsightCard.tsx           # Card hiển thị insight
│   └── ReorderSuggestion.tsx       # Đề xuất đặt hàng
├── hooks/
│   ├── useForecast.ts              # Fetch forecast data
│   └── useAiInsights.ts            # Fetch AI insights
├── services/
│   └── inventoryAiService.ts       # API calls
└── pages/
    └── InventoryForecastPage.tsx   # Main page
```

### 4.2 ForecastChart Component

```tsx
// ForecastChart.tsx

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';

interface ForecastChartProps {
  itemName: string;
  predictions: Array<{
    date: string;
    predicted_qty: number;
  }>;
  currentStock: number;
  reorderPoint: number;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  itemName,
  predictions,
  currentStock,
  reorderPoint,
}) => {
  // Calculate cumulative consumption
  const chartData = predictions.map((p, i) => {
    const cumulativeUsage = predictions
      .slice(0, i + 1)
      .reduce((sum, item) => sum + item.predicted_qty, 0);
    
    return {
      date: p.date,
      predicted: p.predicted_qty,
      remaining: Math.max(0, currentStock - cumulativeUsage),
      reorderLine: reorderPoint,
    };
  });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">{itemName} - Dự báo 14 ngày</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          
          {/* Dự báo tiêu thụ hàng ngày */}
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#3B82F6" 
            name="Dự báo tiêu thụ"
          />
          
          {/* Tồn kho còn lại */}
          <Line 
            type="monotone" 
            dataKey="remaining" 
            stroke="#10B981" 
            strokeWidth={2}
            name="Tồn kho còn lại"
          />
          
          {/* Điểm đặt hàng lại */}
          <Line 
            type="monotone" 
            dataKey="reorderLine" 
            stroke="#EF4444" 
            strokeDasharray="5 5"
            name="Điểm đặt hàng"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {chartData[chartData.length - 1]?.remaining <= reorderPoint && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 font-medium">
            ⚠️ Cần đặt hàng! Tồn kho dự kiến xuống dưới mức an toàn.
          </p>
        </div>
      )}
    </div>
  );
};
```

---

## Phase 5: Tinh chỉnh Model

### 5.1 Thêm External Regressors

```python
# Cải thiện model với các yếu tố bên ngoài

def train_with_regressors(self, item_id: str, data: pd.DataFrame):
    model = NeuralProphet(**self.model_config)
    
    # 1. Ngày lễ Việt Nam
    model.add_country_holidays(country_name="VN")
    
    # 2. Ngày trong tuần (weekend effect)
    data["is_weekend"] = data["ds"].dt.dayofweek.isin([5, 6]).astype(int)
    model.add_future_regressor("is_weekend")
    
    # 3. Thời tiết (nếu có data)
    # model.add_future_regressor("temperature")
    # model.add_future_regressor("is_rainy")
    
    # 4. Sự kiện đặc biệt (promotions, events)
    # model.add_events(events_df)
    
    model.fit(data, freq="D")
    self.models[item_id] = model
```

### 5.2 Model Evaluation & Monitoring

```python
# Đánh giá độ chính xác model

from neuralprophet import set_random_seed
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np

def evaluate_model(self, item_id: str, test_data: pd.DataFrame) -> dict:
    """
    Cross-validation và đánh giá model.
    
    Metrics:
    - MAE: Mean Absolute Error
    - RMSE: Root Mean Square Error  
    - MAPE: Mean Absolute Percentage Error
    """
    set_random_seed(42)
    
    model = self.models.get(item_id)
    if not model:
        return {"error": "Model not found"}
    
    # Predict on test data
    forecast = model.predict(test_data)
    
    y_true = test_data["y"].values
    y_pred = forecast["yhat1"].values[:len(y_true)]
    
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mape = np.mean(np.abs((y_true - y_pred) / (y_true + 1e-8))) * 100
    
    return {
        "item_id": item_id,
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mape": round(mape, 2),
        "accuracy": round(100 - mape, 2)
    }
```

---

## Phase 6: Production Checklist

### 6.1 Monitoring & Logging

```python
# Prometheus metrics
from prometheus_client import Counter, Histogram, generate_latest

PREDICTION_COUNTER = Counter(
    "ai_predictions_total", 
    "Total predictions made",
    ["branch_id", "status"]
)

PREDICTION_LATENCY = Histogram(
    "ai_prediction_latency_seconds",
    "Prediction latency"
)
```

### 6.2 Model Versioning

```python
# Lưu và load model versions
import joblib
from datetime import datetime

def save_model(self, item_id: str, version: str = None):
    if version is None:
        version = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    model = self.models.get(item_id)
    path = f"models/{item_id}/{version}.pkl"
    joblib.dump(model, path)
    
    return {"item_id": item_id, "version": version, "path": path}

def load_model(self, item_id: str, version: str = "latest"):
    path = f"models/{item_id}/{version}.pkl"
    self.models[item_id] = joblib.load(path)
```

### 6.3 Environment Variables

```env
# .env for AI Service

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=smartfnb
DB_USER=smartfnb
DB_PASS=smartfnb123

# Model Config
FORECAST_HORIZON=14
MODEL_EPOCHS=100
MIN_TRAINING_DAYS=30

# API
BACKEND_URL=http://app:8080
API_KEY=your-api-key

# Monitoring
PROMETHEUS_PORT=9090
LOG_LEVEL=INFO
```

---

## 📋 Checklist Tổng hợp

### Backend (Java/Spring Boot)
- [ ] Tạo V6 migration cho inventory tables
- [ ] Tạo JPA entities: InventoryBalance, StockBatch, InventoryTransaction
- [ ] Tạo repositories và services
- [ ] Tạo REST API endpoints
- [ ] Tích hợp WebClient gọi AI Service
- [ ] Thêm Scheduled job cập nhật forecast

### AI Service (Python/FastAPI)
- [ ] Setup project structure
- [ ] Implement DemandForecaster với NeuralProphet
- [ ] Implement DataService (fetch từ DB)
- [ ] Implement InsightService (generate insights)
- [ ] Dockerize service
- [ ] Add to docker-compose.yml

### Frontend (React/TypeScript)
- [ ] Tạo InventoryDashboard page
- [ ] Implement ForecastChart component
- [ ] Implement AiInsightCard component
- [ ] Tạo hooks: useForecast, useAiInsights
- [ ] Tích hợp với backend API

### DevOps
- [ ] Update docker-compose.yml
- [ ] Configure environment variables
- [ ] Setup monitoring (Prometheus/Grafana)
- [ ] Model versioning storage

---

## 📚 Tài liệu Tham khảo

- [NeuralProphet Documentation](https://neuralprophet.com/html/index.html)
- [NeuralProphet GitHub](https://github.com/ourownstory/neural_prophet)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Time Series Forecasting Best Practices](https://otexts.com/fpp3/)

---

**Author:** SmartF&B Team  
**Created:** 2026-03-31  
**Last Updated:** 2026-03-31
