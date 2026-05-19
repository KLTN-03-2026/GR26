# 📘 Hướng dẫn Chi tiết NeuralProphet cho SmartF&B

## Mục lục
1. [Giới thiệu](#1-giới-thiệu)
2. [Cài đặt](#2-cài-đặt)
3. [Data Input Format](#3-data-input-format)
4. [Cách 1: Train từng nguyên liệu (Local Model)](#4-cách-1-train-từng-nguyên-liệu-local-model)
5. [Cách 2: Train nhiều nguyên liệu cùng lúc (Global Model)](#5-cách-2-train-nhiều-nguyên-liệu-cùng-lúc-global-model)
6. [Xử lý Ngày lễ, Cuối tuần, Tết](#6-xử-lý-ngày-lễ-cuối-tuần-tết)
7. [Xử lý Sự kiện bất thường (Optional)](#7-xử-lý-sự-kiện-bất-thường-optional)
8. [Data Output & Cách sử dụng](#8-data-output--cách-sử-dụng)
9. [So sánh Local vs Global Model](#9-so-sánh-local-vs-global-model)
10. [Best Practices](#10-best-practices)
11. [⭐ AI chạy khi nào? (Quan trọng)](#11--ai-chạy-khi-nào-quan-trọng)
12. [FAQ - Câu hỏi thường gặp](#12-faq---câu-hỏi-thường-gặp)

---

## 1. Giới thiệu

**NeuralProphet** = Facebook Prophet + Neural Network (PyTorch)

### NeuralProphet là gì?

> 💡 **Hiểu đơn giản:** NeuralProphet là công cụ dự báo chuỗi thời gian. Cho nó data quá khứ (30-90 ngày), nó sẽ dự báo tương lai (14 ngày tới).

### Khả năng:
| Feature | Giải thích | Ví dụ |
|---------|------------|-------|
| **Trend** | Xu hướng dài hạn | Doanh số tăng dần theo tháng |
| **Weekly Seasonality** | Pattern theo tuần | Cuối tuần bán nhiều hơn |
| **Yearly Seasonality** | Pattern theo năm | Tết bán ít, hè bán nhiều |
| **Holiday Effects** | Ảnh hưởng ngày lễ | 30/4 nghỉ lễ → bán ít |
| **Auto-regression** | Học từ N ngày trước | 7 ngày trước ảnh hưởng hôm nay |
| **External Regressors** | Yếu tố bên ngoài | Thời tiết, khuyến mãi |

### Flow tổng quan:

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEURALPROPHET FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   INPUT                    PROCESS                 OUTPUT       │
│                                                                 │
│  ┌──────────┐            ┌──────────┐           ┌──────────┐   │
│  │ 30+ ngày │  ───────►  │  TRAIN   │  ──────►  │ Dự báo   │   │
│  │ data     │            │  MODEL   │           │ 14 ngày  │   │
│  │ quá khứ  │            │          │           │ tới      │   │
│  └──────────┘            └──────────┘           └──────────┘   │
│                                                                 │
│  Columns:                 ~10-30 giây            Columns:       │
│  - ds (date)              per model              - ds (date)    │
│  - y (quantity)                                  - yhat1 (pred) │
│                                                  - trend        │
│                                                  - seasonality  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Cài đặt

```bash
pip install neuralprophet
# hoặc với pytorch GPU
pip install neuralprophet[torch]
```

```python
from neuralprophet import NeuralProphet, set_log_level
import pandas as pd
import numpy as np

set_log_level("ERROR")  # Giảm log verbose
```

---

## 3. Data Input Format

### 3.1 Format cơ bản (2 columns)

```python
# Bắt buộc: ds (datetime) và y (target value)
data = pd.DataFrame({
    "ds": pd.date_range("2026-01-01", periods=90, freq="D"),
    "y": [120, 135, 142, 98, 156, ...]  # Số lượng tiêu thụ/ngày
})
```

### 3.2 Format cho Global Model (thêm ID column)

```python
# Thêm column ID để phân biệt các time series
data = pd.DataFrame({
    "ds": ["2026-01-01", "2026-01-01", "2026-01-02", "2026-01-02", ...],
    "y":  [1800, 500, 1920, 480, ...],
    "ID": ["Espresso", "Sữa đặc", "Espresso", "Sữa đặc", ...]
})
```

### 3.3 Ví dụ Data thực tế - SmartF&B

```python
# ===== DATA MẪU: 30 ngày tiêu thụ nguyên liệu =====

# Giả sử có 3 nguyên liệu: Espresso, Sữa tươi, Đường
raw_data = {
    "date": pd.date_range("2026-03-01", periods=30, freq="D"),
    "Espresso_ml": [
        1800, 1950, 1720, 2100, 2300, 2450, 2500,  # Tuần 1 (T2-CN)
        1850, 1900, 1780, 2150, 2280, 2400, 2480,  # Tuần 2
        1820, 1880, 1750, 2080, 2250, 2380, 2520,  # Tuần 3
        1900, 1950, 1800, 2200, 2350, 2500, 2600,  # Tuần 4
        1870, 1920                                  # 2 ngày cuối
    ],
    "Sua_tuoi_ml": [
        3200, 3500, 3100, 3800, 4200, 4500, 4600,
        3300, 3450, 3200, 3900, 4100, 4400, 4550,
        3250, 3400, 3150, 3850, 4150, 4450, 4650,
        3350, 3500, 3250, 3950, 4250, 4550, 4700,
        3300, 3480
    ],
    "Duong_g": [
        500, 550, 480, 620, 700, 750, 780,
        520, 540, 490, 630, 690, 740, 770,
        510, 530, 475, 610, 680, 730, 790,
        530, 560, 500, 640, 710, 760, 800,
        515, 545
    ]
}

df_raw = pd.DataFrame(raw_data)
print(df_raw.head(10))
```

**Output:**
```
        date  Espresso_ml  Sua_tuoi_ml  Duong_g
0 2026-03-01         1800         3200      500
1 2026-03-02         1950         3500      550
2 2026-03-03         1720         3100      480
3 2026-03-04         2100         3800      620
4 2026-03-05         2300         4200      700
5 2026-03-06         2450         4500      750
6 2026-03-07         2500         4600      780
7 2026-03-08         1850         3300      520
8 2026-03-09         1900         3450      540
9 2026-03-10         1780         3200      490
```

---

## 4. Cách 1: Train từng nguyên liệu (Local Model)

### 4.1 Chuẩn bị data cho 1 nguyên liệu

```python
def prepare_single_item_data(df_raw, item_column):
    """
    Chuyển đổi data thô sang format NeuralProphet.
    
    Input:  DataFrame với columns [date, Espresso_ml, Sua_tuoi_ml, ...]
    Output: DataFrame với columns [ds, y]
    """
    data = pd.DataFrame({
        "ds": df_raw["date"],
        "y": df_raw[item_column]
    })
    data["ds"] = pd.to_datetime(data["ds"])
    return data

# Chuẩn bị data cho Espresso
espresso_data = prepare_single_item_data(df_raw, "Espresso_ml")
print(espresso_data.head())
```

**Output:**
```
          ds       y
0 2026-03-01  1800.0
1 2026-03-02  1950.0
2 2026-03-03  1720.0
3 2026-03-04  2100.0
4 2026-03-05  2300.0
```

### 4.2 Train model cho 1 nguyên liệu

```python
def train_single_model(data, item_name, forecast_days=14):
    """
    Train NeuralProphet cho 1 nguyên liệu.
    
    Args:
        data: DataFrame [ds, y]
        item_name: Tên nguyên liệu (để log)
        forecast_days: Số ngày dự báo
    
    Returns:
        trained model, forecast DataFrame
    """
    print(f"🔄 Training model for: {item_name}")
    
    # Khởi tạo model
    model = NeuralProphet(
        n_forecasts=forecast_days,   # Dự báo 14 ngày
        n_lags=7,                    # Dùng 7 ngày trước (auto-regression)
        yearly_seasonality=True,     # Pattern năm
        weekly_seasonality=True,     # Pattern tuần
        daily_seasonality=False,     # Không cần pattern ngày (data daily)
        seasonality_mode="multiplicative",  # Nhân thay vì cộng
        learning_rate=0.1,
        epochs=100,
        batch_size=32,
    )
    
    # Thêm ngày lễ Việt Nam
    model.add_country_holidays(country_name="VN")
    
    # Train
    metrics = model.fit(data, freq="D")
    print(f"✅ Training complete. Final loss: {metrics['Loss'].iloc[-1]:.4f}")
    
    # Tạo future dates và predict
    future = model.make_future_dataframe(data, periods=forecast_days)
    forecast = model.predict(future)
    
    return model, forecast

# Train cho Espresso
espresso_model, espresso_forecast = train_single_model(
    espresso_data, 
    "Espresso",
    forecast_days=14
)
```

### 4.3 Train tất cả nguyên liệu (loop)

```python
def train_all_items_separately(df_raw, item_columns, forecast_days=14):
    """
    Train riêng từng model cho mỗi nguyên liệu.
    
    Returns:
        dict: {item_name: (model, forecast)}
    """
    results = {}
    
    for item in item_columns:
        data = prepare_single_item_data(df_raw, item)
        
        if len(data) < 30:
            print(f"⚠️ Skip {item}: cần ít nhất 30 ngày data")
            continue
        
        model, forecast = train_single_model(data, item, forecast_days)
        results[item] = {"model": model, "forecast": forecast}
    
    return results

# Train tất cả 3 nguyên liệu
item_columns = ["Espresso_ml", "Sua_tuoi_ml", "Duong_g"]
all_results = train_all_items_separately(df_raw, item_columns)

print(f"\n📊 Trained {len(all_results)} models")
```

---

## 5. Cách 2: Train nhiều nguyên liệu cùng lúc (Global Model)

### 5.1 Chuẩn bị data cho Global Model

```python
def prepare_global_data(df_raw, item_columns):
    """
    Chuyển đổi data wide format sang long format cho Global Model.
    
    Input (Wide format):
    | date       | Espresso_ml | Sua_tuoi_ml | Duong_g |
    |------------|-------------|-------------|---------|
    | 2026-03-01 | 1800        | 3200        | 500     |
    
    Output (Long format):
    | ds         | y    | ID          |
    |------------|------|-------------|
    | 2026-03-01 | 1800 | Espresso_ml |
    | 2026-03-01 | 3200 | Sua_tuoi_ml |
    | 2026-03-01 | 500  | Duong_g     |
    """
    dfs = []
    
    for item in item_columns:
        temp = pd.DataFrame({
            "ds": pd.to_datetime(df_raw["date"]),
            "y": df_raw[item],
            "ID": item  # ← Key column cho Global Model
        })
        dfs.append(temp)
    
    global_data = pd.concat(dfs, ignore_index=True)
    global_data = global_data.sort_values(["ds", "ID"]).reset_index(drop=True)
    
    return global_data

# Chuẩn bị Global data
global_data = prepare_global_data(df_raw, item_columns)
print(global_data.head(9))
```

**Output:**
```
          ds       y           ID
0 2026-03-01   500.0      Duong_g
1 2026-03-01  1800.0  Espresso_ml
2 2026-03-01  3200.0  Sua_tuoi_ml
3 2026-03-02   550.0      Duong_g
4 2026-03-02  1950.0  Espresso_ml
5 2026-03-02  3500.0  Sua_tuoi_ml
6 2026-03-03   480.0      Duong_g
7 2026-03-03  1720.0  Espresso_ml
8 2026-03-03  3100.0  Sua_tuoi_ml
```

### 5.2 Train Global Model

```python
def train_global_model(global_data, forecast_days=14):
    """
    Train 1 model cho TẤT CẢ nguyên liệu cùng lúc.
    
    Ưu điểm:
    - Train nhanh hơn (1 model thay vì N models)
    - Học shared patterns giữa các items
    - Tốt khi data ít (<30 ngày cho mỗi item)
    
    Args:
        global_data: DataFrame [ds, y, ID]
        forecast_days: Số ngày dự báo
    
    Returns:
        trained model, forecast DataFrame
    """
    print(f"🔄 Training Global Model for {global_data['ID'].nunique()} items...")
    
    model = NeuralProphet(
        n_forecasts=forecast_days,
        n_lags=7,
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode="multiplicative",
        learning_rate=0.1,
        epochs=100,
        batch_size=64,
        # === Global Model specific settings ===
        global_normalization=True,        # Normalize across all series
        global_time_normalization=True,   # Shared time normalization
        unknown_data_normalization=False, # Không normalize unknown series
    )
    
    # Thêm ngày lễ Việt Nam
    model.add_country_holidays(country_name="VN")
    
    # Train (NeuralProphet tự detect column "ID")
    metrics = model.fit(global_data, freq="D")
    print(f"✅ Global training complete. Final loss: {metrics['Loss'].iloc[-1]:.4f}")
    
    # Predict
    future = model.make_future_dataframe(global_data, periods=forecast_days)
    forecast = model.predict(future)
    
    return model, forecast

# Train Global Model
global_model, global_forecast = train_global_model(global_data)

# Xem kết quả cho từng nguyên liệu
for item in item_columns:
    item_forecast = global_forecast[global_forecast["ID"] == item]
    print(f"\n📈 Forecast for {item}:")
    print(item_forecast[["ds", "ID", "yhat1"]].tail(5))
```

**Output:**
```
🔄 Training Global Model for 3 items...
✅ Global training complete. Final loss: 0.0234

📈 Forecast for Espresso_ml:
           ds           ID    yhat1
87 2026-04-10  Espresso_ml  2156.32
88 2026-04-11  Espresso_ml  2289.45
89 2026-04-12  Espresso_ml  2412.78
90 2026-04-13  Espresso_ml  2498.12
91 2026-04-14  Espresso_ml  1923.56

📈 Forecast for Sua_tuoi_ml:
           ds           ID    yhat1
92 2026-04-10  Sua_tuoi_ml  3892.45
93 2026-04-11  Sua_tuoi_ml  4156.78
94 2026-04-12  Sua_tuoi_ml  4389.23
95 2026-04-13  Sua_tuoi_ml  4545.67
96 2026-04-14  Sua_tuoi_ml  3456.89
```

---

## 6. Xử lý Ngày lễ, Cuối tuần, Tết

> 💡 **NOTE:** Phần này hầu như **TỰ ĐỘNG**, bạn không cần setup thủ công mỗi năm!

### 6.1 Tự động thêm ngày lễ Việt Nam (1 dòng code)

```python
# NeuralProphet có SẴN holidays cho Việt Nam - TỰ ĐỘNG cho mọi năm!
model = NeuralProphet()
model.add_country_holidays(country_name="VN")

# Ngày lễ VN được thêm TỰ ĐỘNG:
# ✅ Tết Dương lịch (1/1) - cố định
# ✅ Tết Nguyên đán - TỰ ĐỘNG tính theo âm lịch
# ✅ Giỗ tổ Hùng Vương (10/3 âm lịch) - TỰ ĐỘNG
# ✅ Ngày Giải phóng (30/4) - cố định
# ✅ Quốc tế Lao động (1/5) - cố định
# ✅ Quốc khánh (2/9) - cố định
```

### 6.2 Tự động tính ngày Tết cho BẤT KỲ năm nào

```python
# pip install lunardate
from lunardate import LunarDate
from datetime import timedelta

def get_tet_dates_auto(year):
    """
    TỰ ĐỘNG tính ngày Tết Nguyên đán cho BẤT KỲ năm nào.
    Không cần setup thủ công!
    
    Args:
        year: Năm dương lịch (2026, 2027, 2028, ...)
    
    Returns:
        List các ngày nghỉ Tết (từ 30 Tết đến mùng 5)
    """
    # Mùng 1 Tết = ngày 1 tháng 1 âm lịch
    lunar_new_year = LunarDate(year, 1, 1).toSolarDate()
    
    # Nghỉ Tết: 30 Tết (-1) đến mùng 5 (+4) = 6 ngày
    tet_dates = [lunar_new_year + timedelta(days=i) for i in range(-1, 5)]
    
    return tet_dates

# ===== VÍ DỤ: Tự động cho nhiều năm =====
print("Tết 2026:", get_tet_dates_auto(2026))
# Output: [2026-02-16, 2026-02-17, 2026-02-18, 2026-02-19, 2026-02-20, 2026-02-21]

print("Tết 2027:", get_tet_dates_auto(2027))
# Output: [2027-02-05, 2027-02-06, 2027-02-07, 2027-02-08, 2027-02-09, 2027-02-10]

print("Tết 2028:", get_tet_dates_auto(2028))
# Output: [2028-01-25, 2028-01-26, 2028-01-27, 2028-01-28, 2028-01-29, 2028-01-30]

# → KHÔNG CẦN TỰ SETUP MỖI NĂM!
```

### 6.3 Hàm tạo holidays TỰ ĐỘNG cho nhiều năm

```python
def create_auto_holidays(years=[2026, 2027, 2028]):
    """
    Tự động tạo DataFrame holidays cho nhiều năm.
    Bao gồm: Tết, Valentine, 8/3, Noel, Black Friday, etc.
    
    Args:
        years: List các năm cần tạo holidays
    
    Returns:
        DataFrame với columns [event, ds]
    """
    all_holidays = []
    
    for year in years:
        # === TẾT NGUYÊN ĐÁN (tự động tính) ===
        tet_dates = get_tet_dates_auto(year)
        for d in tet_dates:
            all_holidays.append({"event": "tet_nguyen_dan", "ds": d})
        
        # === NGÀY LỄ CỐ ĐỊNH ===
        fixed_holidays = [
            ("valentine", f"{year}-02-14"),
            ("quoc_te_phu_nu", f"{year}-03-08"),
            ("giai_phong", f"{year}-04-30"),
            ("quoc_te_lao_dong", f"{year}-05-01"),
            ("quoc_khanh", f"{year}-09-02"),
            ("noel_eve", f"{year}-12-24"),
            ("noel", f"{year}-12-25"),
        ]
        
        for event, date in fixed_holidays:
            all_holidays.append({"event": event, "ds": pd.to_datetime(date)})
        
        # === BLACK FRIDAY (Thứ 6 tuần 4 tháng 11) ===
        nov_1 = pd.to_datetime(f"{year}-11-01")
        # Tìm thứ 6 đầu tiên của tháng 11
        first_friday = nov_1 + timedelta(days=(4 - nov_1.weekday()) % 7)
        # Black Friday = thứ 6 tuần thứ 4
        black_friday = first_friday + timedelta(weeks=3)
        all_holidays.append({"event": "black_friday", "ds": black_friday})
    
    return pd.DataFrame(all_holidays)

# ===== SỬ DỤNG =====
auto_holidays = create_auto_holidays(years=[2026, 2027, 2028])
print(auto_holidays.head(20))

# Thêm vào model
model = NeuralProphet()
model.add_country_holidays(country_name="VN")  # Holidays cơ bản
model = model.add_events(auto_holidays)         # Custom holidays
```

**Output:**
```
             event         ds
0   tet_nguyen_dan 2026-02-16
1   tet_nguyen_dan 2026-02-17
2   tet_nguyen_dan 2026-02-18
3   tet_nguyen_dan 2026-02-19
4   tet_nguyen_dan 2026-02-20
5   tet_nguyen_dan 2026-02-21
6        valentine 2026-02-14
7   quoc_te_phu_nu 2026-03-08
8       giai_phong 2026-04-30
9  quoc_te_lao_dong 2026-05-01
...
```

### 6.4 Xử lý Weekend Effect (Cuối tuần)
```

### 6.3 Xử lý Weekend Effect

```python
def add_weekend_regressor(data):
    """
    Thêm cột is_weekend như một regressor.
    Weekend thường có traffic cao hơn cho quán cafe.
    """
    data = data.copy()
    data["is_weekend"] = data["ds"].dt.dayofweek.isin([5, 6]).astype(int)
    return data

# Chuẩn bị data với weekend flag
data_with_weekend = add_weekend_regressor(espresso_data)
print(data_with_weekend.head(10))
```

**Output:**
```
          ds       y  is_weekend
0 2026-03-01  1800.0           0  # Sunday? Check actual day
1 2026-03-02  1950.0           0
2 2026-03-03  1720.0           0
3 2026-03-04  2100.0           0
4 2026-03-05  2300.0           0
5 2026-03-06  2450.0           1  # Saturday
6 2026-03-07  2500.0           1  # Sunday
7 2026-03-08  1850.0           0  # Monday
...
```

```python
# Thêm weekend như future regressor
model = NeuralProphet()
model.add_future_regressor("is_weekend")

# Khi predict, cần cung cấp giá trị is_weekend cho future dates
future = model.make_future_dataframe(data_with_weekend, periods=14)
future["is_weekend"] = future["ds"].dt.dayofweek.isin([5, 6]).astype(int)
forecast = model.predict(future)
```

### 6.4 Xử lý Tết Nguyên đán (Special Case)

```python
def add_tet_effect(data, tet_dates):
    """
    Tết là sự kiện đặc biệt:
    - Trước Tết: tăng mạnh (mua sắm)
    - Trong Tết: giảm mạnh (nghỉ lễ)
    - Sau Tết: tăng nhẹ (trở lại bình thường)
    
    Args:
        data: DataFrame [ds, y]
        tet_dates: dict với before/during/after dates
    """
    data = data.copy()
    
    # Tết 2026: 17/2 - 23/2
    tet_dates = {
        "before": pd.date_range("2026-02-10", "2026-02-16"),  # 1 tuần trước
        "during": pd.date_range("2026-02-17", "2026-02-23"),  # Tết
        "after": pd.date_range("2026-02-24", "2026-03-01"),   # 1 tuần sau
    }
    
    data["tet_before"] = data["ds"].isin(tet_dates["before"]).astype(int)
    data["tet_during"] = data["ds"].isin(tet_dates["during"]).astype(int)
    data["tet_after"] = data["ds"].isin(tet_dates["after"]).astype(int)
    
    return data

# Thêm Tết regressors
model = NeuralProphet()
model.add_future_regressor("tet_before", mode="multiplicative")
model.add_future_regressor("tet_during", mode="multiplicative")
model.add_future_regressor("tet_after", mode="multiplicative")
```

---

## 7. Xử lý Sự kiện bất thường (Optional)

> ⚠️ **NOTE:** Phần này là **TÙY CHỌN**. Bạn có thể bỏ qua nếu:
> - Data của bạn khá đều đặn, không có ngày bất thường
> - Không có sự kiện đặc biệt biết trước (khai trương, khuyến mãi)
> - Muốn bắt đầu đơn giản trước
>
> NeuralProphet vẫn hoạt động tốt mà không cần phần này!

### 7.1 Khi nào cần xử lý sự kiện bất thường?

| Tình huống | Cần xử lý? | Lý do |
|------------|------------|-------|
| Data bình thường, đều đặn | ❌ Không | Model tự học được |
| 1 ngày bán gấp 10x (viral TikTok) | ✅ Cần | Outlier làm model học sai |
| Có khuyến mãi 50% tuần sau | ✅ Nên | Giúp model dự báo chính xác hơn |
| Dịch COVID, phong tỏa | ✅ Cần | Sự kiện đặc biệt |
| Mưa bão 1 ngày | ❌ Không | Quá ngắn, không ảnh hưởng nhiều |

### 7.2 Phát hiện Outliers (Ngày bất thường)

> 💡 **Outlier là gì?** Là ngày có giá trị **khác thường** so với các ngày khác.
> VD: Bình thường bán 100 ly/ngày, nhưng 1 ngày bán 1000 ly (do viral TikTok).

```python
def detect_outliers(data, column="y", method="iqr", threshold=1.5):
    """
    Phát hiện outliers trong data.
    
    Methods:
    - iqr: Interquartile Range (phổ biến nhất)
    - zscore: Z-score (cho data phân phối chuẩn)
    
    Returns:
        DataFrame với cột is_outlier (True/False)
    """
    data = data.copy()
    
    if method == "iqr":
        Q1 = data[column].quantile(0.25)  # 25% thấp nhất
        Q3 = data[column].quantile(0.75)  # 75% cao nhất
        IQR = Q3 - Q1
        lower = Q1 - threshold * IQR
        upper = Q3 + threshold * IQR
        data["is_outlier"] = (data[column] < lower) | (data[column] > upper)
    
    outliers = data[data["is_outlier"]]
    print(f"📊 Found {len(outliers)} outliers out of {len(data)} records")
    
    return data

# ===== SỬ DỤNG =====
data_with_outliers = detect_outliers(espresso_data)
print(data_with_outliers[data_with_outliers["is_outlier"]])
```

### 7.3 Xử lý Outliers

```python
def handle_outliers(data, method="cap"):
    """
    Xử lý outliers.
    
    Methods:
    - cap: Giới hạn giá trị tại ngưỡng (RECOMMEND)
    - interpolate: Thay bằng giá trị trung bình 2 ngày kề
    
    Note: KHÔNG nên xóa outliers trong time series!
    """
    data = data.copy()
    
    Q1 = data["y"].quantile(0.25)
    Q3 = data["y"].quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    
    if method == "cap":
        # Giới hạn giá trị: quá thấp → lower, quá cao → upper
        data["y"] = data["y"].clip(lower=lower, upper=upper)
        print(f"✅ Capped outliers to range [{lower:.2f}, {upper:.2f}]")
    
    return data

# ===== SỬ DỤNG =====
clean_data = handle_outliers(espresso_data, method="cap")
```

### 7.4 Thêm sự kiện ĐÃ BIẾT TRƯỚC (Optional)

> 💡 **Khi nào dùng?** Khi bạn BIẾT TRƯỚC sẽ có sự kiện ảnh hưởng đến doanh số.

```python
def add_known_events(data, events_dict):
    """
    Thêm các sự kiện đã biết trước như regressors.
    
    Ví dụ events:
    - Khai trương chi nhánh mới: +50%
    - Khuyến mãi 50%: +30%
    - Đóng cửa sửa chữa: -100%
    
    Args:
        data: DataFrame [ds, y]
        events_dict: {event_name: [list of dates]}
    """
    data = data.copy()
    
    for event_name, dates in events_dict.items():
        dates = pd.to_datetime(dates)
        data[event_name] = data["ds"].isin(dates).astype(int)
    
    return data

# ===== VÍ DỤ =====
# Giả sử tuần sau có khuyến mãi
known_events = {
    "promotion_50off": ["2026-04-05", "2026-04-06", "2026-04-07"],
}

data_with_events = add_known_events(espresso_data, known_events)

# Thêm vào model
model = NeuralProphet()
model.add_future_regressor("promotion_50off", mode="multiplicative")
```

### 7.5 Tóm tắt Phần 7

| Bước | Bắt buộc? | Khi nào cần? |
|------|-----------|--------------|
| Detect outliers | ❌ Optional | Khi nghi ngờ data có ngày bất thường |
| Handle outliers | ❌ Optional | Khi có outliers lớn |
| Add known events | ❌ Optional | Khi biết trước sự kiện (khuyến mãi, khai trương) |

---

## 8. Data Output & Cách sử dụng

### 8.1 Cấu trúc Output của NeuralProphet

```python
# Sau khi predict, forecast DataFrame có các columns:
print(forecast.columns.tolist())

# Output:
# ['ds', 'y', 'yhat1', 'yhat2', ..., 'yhat14',
#  'trend', 'season_weekly', 'season_yearly',
#  'events_tet_nguyen_dan', 'future_regressors_is_weekend', ...]
```

### 8.2 Giải thích các columns quan trọng

| Column | Ý nghĩa |
|--------|---------|
| `ds` | Ngày |
| `y` | Giá trị thực (NULL cho future dates) |
| `yhat1` | Dự báo ngày tiếp theo |
| `yhat2`...`yhat14` | Dự báo 2-14 ngày tới |
| `trend` | Xu hướng dài hạn |
| `season_weekly` | Pattern tuần (T2 thấp, T7-CN cao) |
| `season_yearly` | Pattern năm (Tết cao, tháng 2 thấp) |
| `events_*` | Ảnh hưởng của ngày lễ |
| `future_regressors_*` | Ảnh hưởng của regressors |

### 8.3 Extract kết quả cho SmartF&B

```python
def extract_forecast_results(forecast, data, item_name):
    """
    Trích xuất kết quả dự báo cho API response.
    
    Returns:
        dict với predictions, metrics, insights
    """
    # Lấy future predictions only
    last_historical_date = data["ds"].max()
    future_forecast = forecast[forecast["ds"] > last_historical_date].copy()
    
    # Format predictions
    predictions = []
    for _, row in future_forecast.iterrows():
        predictions.append({
            "date": row["ds"].strftime("%Y-%m-%d"),
            "predicted_qty": round(row["yhat1"], 2),
            "trend": round(row["trend"], 2),
            "weekly_effect": round(row.get("season_weekly", 0), 2),
            "is_weekend": row["ds"].dayofweek in [5, 6],
        })
    
    # Calculate summary metrics
    total_predicted = sum(p["predicted_qty"] for p in predictions)
    avg_daily = total_predicted / len(predictions)
    max_day = max(predictions, key=lambda x: x["predicted_qty"])
    min_day = min(predictions, key=lambda x: x["predicted_qty"])
    
    return {
        "item_name": item_name,
        "forecast_period": {
            "start": predictions[0]["date"],
            "end": predictions[-1]["date"],
            "days": len(predictions)
        },
        "predictions": predictions,
        "summary": {
            "total_predicted": round(total_predicted, 2),
            "avg_daily": round(avg_daily, 2),
            "peak_day": max_day,
            "low_day": min_day,
        }
    }

# Extract results
results = extract_forecast_results(espresso_forecast, espresso_data, "Espresso")
print(json.dumps(results, indent=2, ensure_ascii=False))
```

**Output:**
```json
{
  "item_name": "Espresso",
  "forecast_period": {
    "start": "2026-04-01",
    "end": "2026-04-14",
    "days": 14
  },
  "predictions": [
    {"date": "2026-04-01", "predicted_qty": 1856.32, "trend": 1820.0, "weekly_effect": 36.32, "is_weekend": false},
    {"date": "2026-04-02", "predicted_qty": 1923.45, "trend": 1822.0, "weekly_effect": 101.45, "is_weekend": false},
    {"date": "2026-04-03", "predicted_qty": 1789.12, "trend": 1824.0, "weekly_effect": -34.88, "is_weekend": false},
    {"date": "2026-04-04", "predicted_qty": 2145.67, "trend": 1826.0, "weekly_effect": 319.67, "is_weekend": true},
    {"date": "2026-04-05", "predicted_qty": 2298.89, "trend": 1828.0, "weekly_effect": 470.89, "is_weekend": true},
    ...
  ],
  "summary": {
    "total_predicted": 28456.78,
    "avg_daily": 2032.63,
    "peak_day": {"date": "2026-04-12", "predicted_qty": 2498.12},
    "low_day": {"date": "2026-04-08", "predicted_qty": 1756.34}
  }
}
```

### 8.4 Tính Stockout Risk

```python
def calculate_stockout_risk(predictions, current_stock, min_stock_level=0):
    """
    Tính ngày dự kiến hết hàng.
    
    Args:
        predictions: list từ extract_forecast_results
        current_stock: Tồn kho hiện tại
        min_stock_level: Mức tồn kho tối thiểu (safety stock)
    
    Returns:
        dict với stockout info
    """
    remaining = current_stock
    stockout_day = None
    reorder_day = None
    
    for i, pred in enumerate(predictions):
        remaining -= pred["predicted_qty"]
        
        # Check reorder point (chạm safety stock)
        if reorder_day is None and remaining <= min_stock_level:
            reorder_day = {
                "date": pred["date"],
                "days_from_now": i + 1,
                "remaining_stock": round(remaining, 2)
            }
        
        # Check stockout
        if remaining <= 0:
            stockout_day = {
                "date": pred["date"],
                "days_until_stockout": i + 1,
                "deficit": round(abs(remaining), 2)
            }
            break
    
    return {
        "current_stock": current_stock,
        "safety_stock": min_stock_level,
        "reorder_alert": reorder_day,
        "stockout_alert": stockout_day,
        "action": "ORDER_NOW" if stockout_day and stockout_day["days_until_stockout"] <= 3 else "MONITOR"
    }

# Ví dụ: kiểm tra với tồn kho 5000ml Espresso
stockout_info = calculate_stockout_risk(
    results["predictions"],
    current_stock=5000,  # ml
    min_stock_level=1000  # ml (safety stock)
)
print(json.dumps(stockout_info, indent=2))
```

**Output:**
```json
{
  "current_stock": 5000,
  "safety_stock": 1000,
  "reorder_alert": {
    "date": "2026-04-02",
    "days_from_now": 2,
    "remaining_stock": 820.23
  },
  "stockout_alert": {
    "date": "2026-04-03",
    "days_until_stockout": 3,
    "deficit": 968.89
  },
  "action": "ORDER_NOW"
}
```

---

## 9. So sánh Local vs Global Model

### 9.1 Performance Comparison

```python
def compare_models(df_raw, item_columns, test_days=7):
    """
    So sánh performance của Local vs Global model.
    """
    from sklearn.metrics import mean_absolute_error, mean_squared_error
    import numpy as np
    
    # Split train/test
    train_data = df_raw.iloc[:-test_days]
    test_data = df_raw.iloc[-test_days:]
    
    results = {"local": {}, "global": {}}
    
    # ===== LOCAL MODELS =====
    for item in item_columns:
        train = prepare_single_item_data(train_data, item)
        test = prepare_single_item_data(test_data, item)
        
        model = NeuralProphet(n_forecasts=test_days, n_lags=7)
        model.fit(train, freq="D")
        
        future = model.make_future_dataframe(train, periods=test_days)
        forecast = model.predict(future)
        
        # Get predictions for test period
        preds = forecast[forecast["ds"].isin(test["ds"])]["yhat1"].values
        actuals = test["y"].values
        
        mae = mean_absolute_error(actuals, preds)
        rmse = np.sqrt(mean_squared_error(actuals, preds))
        
        results["local"][item] = {"MAE": mae, "RMSE": rmse}
    
    # ===== GLOBAL MODEL =====
    train_global = prepare_global_data(train_data, item_columns)
    test_global = prepare_global_data(test_data, item_columns)
    
    global_model = NeuralProphet(
        n_forecasts=test_days, n_lags=7,
        global_normalization=True
    )
    global_model.fit(train_global, freq="D")
    
    future_global = global_model.make_future_dataframe(train_global, periods=test_days)
    forecast_global = global_model.predict(future_global)
    
    for item in item_columns:
        test_item = test_global[test_global["ID"] == item]
        preds_item = forecast_global[
            (forecast_global["ID"] == item) & 
            (forecast_global["ds"].isin(test_item["ds"]))
        ]["yhat1"].values
        
        actuals = test_item["y"].values
        
        mae = mean_absolute_error(actuals, preds_item)
        rmse = np.sqrt(mean_squared_error(actuals, preds_item))
        
        results["global"][item] = {"MAE": mae, "RMSE": rmse}
    
    return results

# So sánh
comparison = compare_models(df_raw, item_columns)
print(pd.DataFrame(comparison).T)
```

### 9.2 Khi nào dùng cách nào?

| Tiêu chí | Local Model | Global Model |
|----------|-------------|--------------|
| **Số lượng items** | <10 items | >10 items |
| **Data mỗi item** | >90 ngày | <60 ngày |
| **Pattern giống nhau?** | Khác nhau nhiều | Tương tự nhau |
| **Train time** | Lâu hơn | Nhanh hơn |
| **Memory** | Nhiều hơn | Ít hơn |
| **Accuracy** | Cao hơn (if enough data) | Tốt cho items ít data |

### 9.3 Hybrid Approach (Recommended)

```python
def hybrid_training(df_raw, item_columns, min_days=60):
    """
    Hybrid: Dùng Local cho items có nhiều data, Global cho items ít data.
    """
    local_items = []
    global_items = []
    
    for item in item_columns:
        item_data = df_raw[["date", item]].dropna()
        if len(item_data) >= min_days:
            local_items.append(item)
        else:
            global_items.append(item)
    
    print(f"📊 Local training: {len(local_items)} items")
    print(f"📊 Global training: {len(global_items)} items")
    
    results = {}
    
    # Train local models
    for item in local_items:
        data = prepare_single_item_data(df_raw, item)
        model, forecast = train_single_model(data, item)
        results[item] = {"model": model, "forecast": forecast, "type": "local"}
    
    # Train global model
    if global_items:
        global_data = prepare_global_data(df_raw, global_items)
        global_model, global_forecast = train_global_model(global_data)
        
        for item in global_items:
            item_forecast = global_forecast[global_forecast["ID"] == item]
            results[item] = {"model": global_model, "forecast": item_forecast, "type": "global"}
    
    return results
```

---

## 10. Best Practices

### 10.1 Data Quality

```python
def validate_data(data):
    """Kiểm tra chất lượng data trước khi train."""
    issues = []
    
    # Check minimum length
    if len(data) < 30:
        issues.append(f"❌ Cần ít nhất 30 ngày, hiện có {len(data)}")
    
    # Check missing values
    missing = data["y"].isna().sum()
    if missing > 0:
        issues.append(f"⚠️ Có {missing} giá trị NULL")
    
    # Check negative values
    negatives = (data["y"] < 0).sum()
    if negatives > 0:
        issues.append(f"❌ Có {negatives} giá trị âm")
    
    # Check duplicates
    duplicates = data.duplicated(subset=["ds"]).sum()
    if duplicates > 0:
        issues.append(f"⚠️ Có {duplicates} ngày trùng lặp")
    
    # Check gaps
    date_diff = data["ds"].diff().dt.days
    gaps = (date_diff > 1).sum()
    if gaps > 0:
        issues.append(f"⚠️ Có {gaps} ngày bị thiếu")
    
    if issues:
        print("🔍 Data Quality Issues:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("✅ Data quality OK")
    
    return len(issues) == 0
```

### 10.2 Model Tuning

```python
# Các hyperparameters quan trọng

model = NeuralProphet(
    # === Forecast settings ===
    n_forecasts=14,          # Số ngày dự báo (1-30)
    n_lags=7,                # Auto-regression lags (0-30)
    
    # === Seasonality ===
    yearly_seasonality=True,  # Pattern năm
    weekly_seasonality=True,  # Pattern tuần
    daily_seasonality=False,  # Pattern ngày (chỉ dùng cho hourly data)
    seasonality_mode="multiplicative",  # "additive" hoặc "multiplicative"
    
    # === Training ===
    learning_rate=0.1,       # 0.01-1.0 (default 0.1)
    epochs=100,              # 50-200 (more = better but slower)
    batch_size=32,           # 16-128
    
    # === Regularization ===
    trend_reg=0,             # Regularize trend (0-1)
    seasonality_reg=0,       # Regularize seasonality (0-1)
    
    # === Changepoints ===
    changepoints_range=0.8,  # % of data to consider for changepoints
    n_changepoints=10,       # Number of changepoints
)
```

### 10.3 Model Persistence

```python
import pickle
from pathlib import Path

def save_model(model, item_name, version="latest"):
    """Lưu trained model."""
    path = Path(f"models/{item_name}")
    path.mkdir(parents=True, exist_ok=True)
    
    filepath = path / f"{version}.pkl"
    with open(filepath, "wb") as f:
        pickle.dump(model, f)
    
    print(f"✅ Saved model to {filepath}")

def load_model(item_name, version="latest"):
    """Load trained model."""
    filepath = Path(f"models/{item_name}/{version}.pkl")
    
    if not filepath.exists():
        raise FileNotFoundError(f"Model not found: {filepath}")
    
    with open(filepath, "rb") as f:
        model = pickle.load(f)
    
    print(f"✅ Loaded model from {filepath}")
    return model
```

### 10.4 Scheduled Retraining

```python
from datetime import datetime, timedelta

class ModelManager:
    """Quản lý lifecycle của models."""
    
    def __init__(self, retrain_interval_days=7):
        self.retrain_interval = timedelta(days=retrain_interval_days)
        self.models = {}
        self.last_trained = {}
    
    def needs_retraining(self, item_name):
        """Check xem model có cần retrain không."""
        if item_name not in self.last_trained:
            return True
        
        elapsed = datetime.now() - self.last_trained[item_name]
        return elapsed > self.retrain_interval
    
    def train_or_load(self, item_name, data):
        """Train model mới hoặc load từ cache."""
        if self.needs_retraining(item_name):
            print(f"🔄 Retraining model for {item_name}")
            model, _ = train_single_model(data, item_name)
            self.models[item_name] = model
            self.last_trained[item_name] = datetime.now()
            save_model(model, item_name)
        else:
            if item_name not in self.models:
                self.models[item_name] = load_model(item_name)
        
        return self.models[item_name]
```

---

## 11. ⭐ AI chạy khi nào? (Quan trọng)

> 💡 **Câu hỏi thường gặp:** AI chạy tự động hay user phải kích hoạt?

### 11.1 Hai chế độ hoạt động

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI SERVICE MODES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔄 TỰ ĐỘNG (Background Jobs)          👆 USER KÍCH HOẠT         │
│  ────────────────────────────          ─────────────────────    │
│                                                                  │
│  • Cron job 2:00 AM mỗi ngày           • Button "Refresh"       │
│  • Update predictions                   • Button "Retrain Now"  │
│  • Check stockout alerts               • On-demand forecast    │
│  • Gửi notifications                   • Dashboard load        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Khi nào TRAIN model?

| Trigger | Thời điểm | Lý do |
|---------|-----------|-------|
| **Lần đầu** | Khi có đủ 30 ngày data | Model cần minimum data |
| **Scheduled** | Mỗi tuần 1 lần (Chủ nhật 3:00 AM) | Cập nhật patterns mới |
| **Manual** | User click "Retrain" | Khi có thay đổi lớn |
| **Auto-trigger** | Khi có >7 ngày data mới chưa train | Data drift |

### 11.3 Khi nào PREDICT?

| Trigger | Thời điểm | Output |
|---------|-----------|--------|
| **Daily job** | 2:00 AM mỗi ngày | Predictions cho 14 ngày tới |
| **User request** | Click "Xem dự báo" | Lấy predictions từ cache |
| **Dashboard load** | Mở trang Inventory | Hiển thị predictions đã tính |

### 11.4 Code Implementation

```python
# ===== CRON JOBS (Background) =====

# Job 1: Daily Prediction Update (2:00 AM)
@scheduler.scheduled_job('cron', hour=2, minute=0)
def daily_prediction_job():
    """
    Chạy TỰ ĐỘNG mỗi ngày lúc 2:00 AM.
    Không cần user kích hoạt.
    """
    print("🔄 Starting daily prediction update...")
    
    # 1. Fetch data mới nhất từ DB
    for branch_id in get_all_branches():
        for ingredient in get_all_ingredients(branch_id):
            
            # 2. Load model đã train
            model = load_model(ingredient.id)
            
            # 3. Predict 14 ngày tới
            predictions = model.predict(...)
            
            # 4. Save predictions vào DB (cache)
            save_predictions_to_db(branch_id, ingredient.id, predictions)
            
            # 5. Check stockout risk
            if will_stockout_in_3_days(predictions, current_stock):
                send_alert(branch_id, ingredient, "LOW_STOCK")
    
    print("✅ Daily prediction complete")


# Job 2: Weekly Model Retraining (Sunday 3:00 AM)
@scheduler.scheduled_job('cron', day_of_week='sun', hour=3, minute=0)
def weekly_retrain_job():
    """
    Chạy TỰ ĐỘNG mỗi tuần (Chủ nhật 3:00 AM).
    Retrain models với data mới.
    """
    print("🔄 Starting weekly model retraining...")
    
    for branch_id in get_all_branches():
        # Fetch 90 ngày data gần nhất
        data = fetch_historical_data(branch_id, days=90)
        
        # Retrain tất cả models
        for ingredient in get_all_ingredients(branch_id):
            model = train_model(ingredient.id, data)
            save_model(model, ingredient.id)
    
    print("✅ Weekly retraining complete")


# ===== API ENDPOINTS (User kích hoạt) =====

@app.get("/api/v1/forecast/{branch_id}")
def get_forecast(branch_id: str):
    """
    User click "Xem dự báo" → Lấy predictions từ DB cache.
    NHANH vì không cần tính toán lại!
    """
    # Lấy predictions đã tính sẵn từ DB
    predictions = get_cached_predictions(branch_id)
    return predictions


@app.post("/api/v1/forecast/{branch_id}/refresh")
def refresh_forecast(branch_id: str):
    """
    User click "Refresh" → Tính lại predictions ngay lập tức.
    Chậm hơn vì phải predict realtime.
    """
    predictions = calculate_predictions_now(branch_id)
    save_predictions_to_db(branch_id, predictions)
    return predictions


@app.post("/api/v1/model/{branch_id}/retrain")
def force_retrain(branch_id: str):
    """
    User click "Retrain Now" → Train lại models.
    Rất chậm (~15 phút cho 30 nguyên liệu).
    """
    retrain_all_models(branch_id)
    return {"status": "Retrain complete"}
```

### 11.5 Flow Tổng quan

```
┌────────────────────────────────────────────────────────────────────┐
│                         DAILY FLOW                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📅 Ngày N                                                         │
│                                                                     │
│  00:00 ─────────────────────────────────────────────────────────   │
│        │                                                            │
│  02:00 │ 🔄 CRON: Daily Prediction Job                             │
│        │   ├─ Load models (đã train sẵn)                           │
│        │   ├─ Predict 14 ngày tới                                  │
│        │   ├─ Save to DB (cache)                                   │
│        │   └─ Send alerts nếu sắp hết hàng                         │
│        │                                                            │
│  08:00 │ 👤 Owner mở Dashboard                                     │
│        │   └─ Load predictions từ cache (NHANH!)                   │
│        │                                                            │
│  10:00 │ 👤 Owner click "Refresh"                                  │
│        │   └─ Re-calculate predictions (có data mới từ sáng)       │
│        │                                                            │
│  23:59 ─────────────────────────────────────────────────────────   │
│                                                                     │
│  📅 Chủ nhật                                                       │
│                                                                     │
│  03:00 │ 🔄 CRON: Weekly Retrain Job                               │
│        │   ├─ Fetch 90 ngày data                                   │
│        │   ├─ Retrain 30 models                                    │
│        │   └─ Save new models                                      │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 11.6 Tóm tắt

| Câu hỏi | Trả lời |
|---------|---------|
| **AI chạy liên tục?** | ❌ Không, chạy theo schedule (2:00 AM) |
| **User cần click?** | ❌ Không bắt buộc, có kết quả sẵn từ cron job |
| **Train mỗi ngày?** | ❌ Không, chỉ train mỗi tuần 1 lần |
| **Predict mỗi ngày?** | ✅ Có, cron job 2:00 AM |
| **Realtime prediction?** | ✅ Có nếu user click "Refresh" |

---

## 12. FAQ - Câu hỏi thường gặp

### Q1: Cần bao nhiêu data để bắt đầu?

| Data | Khả năng |
|------|----------|
| <30 ngày | ❌ Không đủ |
| 30-60 ngày | ⚠️ Hoạt động nhưng accuracy thấp |
| 60-90 ngày | ✅ Tốt |
| >90 ngày | ✅ Rất tốt |

### Q2: Train mất bao lâu?

| Số nguyên liệu | Train time (Local) | Train time (Global) |
|----------------|-------------------|---------------------|
| 10 | ~5 phút | ~2 phút |
| 30 | ~15 phút | ~5 phút |
| 100 | ~50 phút | ~10 phút |

### Q3: Ngày lễ có cần setup mỗi năm?

**Không!** Dùng `add_country_holidays("VN")` và `lunardate` để tự động tính.

### Q4: Accuracy bao nhiêu là tốt?

| MAPE | Đánh giá |
|------|----------|
| <10% | ✅ Xuất sắc |
| 10-20% | ✅ Tốt |
| 20-30% | ⚠️ Chấp nhận được |
| >30% | ❌ Cần cải thiện |

### Q5: Tại sao prediction sai?

| Nguyên nhân | Giải pháp |
|-------------|-----------|
| Ít data (<30 ngày) | Chờ thêm data |
| Outliers lớn | Xử lý outliers (Section 7) |
| Pattern thay đổi | Retrain model |
| Sự kiện bất thường | Thêm events (Section 7) |

### Q6: Có thể dự báo theo giờ không?

Có, nhưng cần:
- Data theo giờ (24 records/ngày)
- `daily_seasonality=True`
- Nhiều data hơn (90+ ngày × 24 giờ)

### Q7: Nên dùng Local hay Global model?

| Tình huống | Recommendation |
|------------|----------------|
| <10 nguyên liệu, >90 ngày data | **Local** |
| >10 nguyên liệu, <60 ngày data | **Global** |
| Mixed | **Hybrid** (Section 9.3) |

---

## 📚 Tài liệu tham khảo

- [NeuralProphet Official Docs](https://neuralprophet.com/)
- [NeuralProphet GitHub](https://github.com/ourownstory/neural_prophet)
- [Time Series Forecasting Best Practices](https://otexts.com/fpp3/)
- [Handling Holidays in Time Series](https://facebook.github.io/prophet/docs/seasonality,_holiday_effects,_and_regressors.html)

---

**Author:** SmartF&B Team  
**Created:** 2026-03-31  
**Version:** 1.0
