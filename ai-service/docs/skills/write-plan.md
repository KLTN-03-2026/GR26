# 🗓️ AI Skill: Viết Feature Plan cho SmartF&B AI Service
> Chạy skill này TRƯỚC KHI CODE bất kỳ tính năng nào.
> Output: file `docs/plans/{YYYY-MM-DD}/{stt}-{tên-feature}.md`

---

## 🎯 TRIGGER

Skill này kích hoạt khi developer nói:
- "Tôi muốn implement [tính năng X]"
- "Viết plan cho [X]"
- "Trước khi code [X], lên kế hoạch đi"

---

## 📄 TEMPLATE FEATURE PLAN

```markdown
# Plan: [Tên tính năng]

**Status:** 🔄 IN PROGRESS
**Service:** ai-service
**Ngày bắt đầu:** DD/MM/YYYY
**Assignee:** @tên

---

## Mô tả
[Tính năng làm gì, thuộc tầng nào (train / predict / api), ảnh hưởng tenant nào]

---

## Vị trí trong cấu trúc thư mục

### Files tạo mới
- [ ] `app/services/[name]_service.py`
- [ ] `app/schemas/[name].py`
- [ ] `app/api/v1/[name].py`
- [ ] `tests/test_[name].py`

### Files sửa đổi
- [ ] `app/main.py`           — mount router mới (nếu có endpoint)
- [ ] `app/scheduler/jobs.py` — thêm cron job (nếu cần)
- [ ] `docs/architecture/api-endpoints.md` — cập nhật danh sách endpoint

---

## Logic chính cần implement
[Mô tả luồng xử lý: input → process → output]

---

## DB liên quan
| Bảng | Thao tác | Ghi chú |
|------|----------|---------|
| `orders` | READ | Lấy lịch sử bán hàng |
| `forecast_results` | WRITE | Ghi kết quả dự báo |

---

## Checklist triển khai

### 1. Data Layer
- [ ] Hàm lấy data từ DB (data_service.py)
- [ ] Validate data đầu vào (đủ ngày, không NaN, không âm)
- [ ] Build DataFrame đúng format NeuralProphet

### 2. ML Layer
- [ ] Config NeuralProphet phù hợp bài toán
- [ ] Train / predict logic
- [ ] Xử lý edge case: data thiếu, model chưa có

### 3. Output Layer
- [ ] Tính ngày hết hàng (stock_calculator.py)
- [ ] Ghi kết quả vào forecast_results
- [ ] Pydantic schema cho response

### 4. API / Scheduler
- [ ] Endpoint FastAPI (nếu cần)
- [ ] Cron job (nếu cần)

### 5. Quality
- [ ] Test với data thật hoặc sample data
- [ ] Kiểm tra filter tenant_id đúng chỗ
- [ ] Không có print() debug
- [ ] Docstring tiếng Việt

---

## Câu hỏi cần xác nhận
- [ ] Q1: [điểm mơ hồ]
- [ ] Q2: [edge case chưa rõ]
```

---

## 📌 VÍ DỤ ĐẦY ĐỦ — "Tính năng predict nhu cầu nguyên liệu"

```markdown
# Plan: Predict nhu cầu nguyên liệu 7 ngày

**Status:** 🔄 IN PROGRESS
**Service:** ai-service
**Ngày bắt đầu:** 14/04/2026
**Assignee:** @hoang

---

## Mô tả
Mỗi đêm 00:30, tự động load model đã train, chạy predict 7 ngày tới
cho tất cả nguyên liệu × chi nhánh của mọi tenant. Kết quả ghi vào
bảng forecast_results để BE/FE đọc vào sáng hôm sau.

---

## Vị trí trong cấu trúc thư mục

### Files tạo mới
- [ ] `app/services/predict_service.py`
- [ ] `app/utils/stock_calculator.py`
- [ ] `tests/test_predict_service.py`
- [ ] `tests/test_stock_calculator.py`

### Files sửa đổi
- [ ] `app/scheduler/jobs.py` — thêm job predict_all_branches
- [ ] `app/models/forecast_result.py` — tạo ORM model nếu chưa có

---

## Logic chính

```
For each tenant:
  Load global_model.np
  For each branch:
    For each active ingredient:
      1. Lấy 14 ngày gần nhất (n_lags=14) làm context
      2. Build DataFrame chuẩn NeuralProphet với cột ID
      3. make_future_dataframe(periods=7)
      4. predict() → lấy cột yhat1
      5. Lấy current_stock từ bảng ingredients
      6. predict_stockout_date() → ngày hết hàng
      7. calc_order_qty() → số lượng gợi ý nhập
      8. Ghi vào forecast_results (upsert theo branch_id + ingredient_id + forecast_date)
```

---

## DB liên quan
| Bảng | Thao tác | Ghi chú |
|------|----------|---------|
| `ingredients` | READ | Lấy current_stock |
| `orders` + `order_details` | READ | Context 14 ngày gần nhất |
| `forecast_results` | WRITE/UPSERT | Kết quả dự báo |

---

## Checklist triển khai

### 1. Data Layer
- [ ] `data_service.get_recent_consumption(branch_id, ingredient_id, days=14)`
- [ ] `data_service.get_current_stock(branch_id, ingredient_id)`

### 2. ML Layer
- [ ] Load model từ `storage/models/{tenant_id}/global_model.np`
- [ ] Fallback nếu model chưa có: trả về None, ghi log warning
- [ ] Predict → extract yhat1 cho 7 ngày

### 3. Output Layer
- [ ] `stock_calculator.predict_stockout_date(current_stock, forecast_df)`
- [ ] `stock_calculator.calc_order_qty(forecast_df, safety_factor=1.2)`
- [ ] Upsert vào forecast_results (không duplicate theo ngày)

### 4. Scheduler
- [ ] Thêm job `predict_all_branches` chạy 00:30 hàng ngày
- [ ] Ghi TrainLog với status success/failed

### 5. Quality
- [ ] Test với DataFrame mẫu 14 ngày
- [ ] Test edge case: current_stock = 0, model chưa train
- [ ] Kiểm tra tenant_id filter mọi query

---

## Câu hỏi cần xác nhận
- [ ] Q1: Nếu model chưa được train lần nào, fallback là gì? (trả 0 hay dùng average 7 ngày gần nhất?)
- [ ] Q2: Safety factor 1.2 có hardcode hay config per-tenant?
```
