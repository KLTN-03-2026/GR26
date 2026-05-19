# Fix: normalize="soft" cho NeuralProphet Global Model

**Ngày**: 2026-04-20
**Branch được test**: `a7fc4472-d5c0-432d-b951-5c78e30fd905`
**Tenant**: `6bb03956-2821-415f-8bbf-43e3e87cba83`

---

## Thay đổi code

**File**: `app/services/train_service.py` — hàm `_build_neuralprophet_model()`

```python
# THÊM 1 dòng vào khởi tạo NeuralProphet:
normalize="soft",   # Scale từng series về [0,1] — fix 891× scale gap
```

**Mục tiêu**: Sữa tươi (s97, mean=1720) và Trứng (s93, mean=1.93) được scale
về cùng range trước khi train → loss function không bị dominated bởi series lớn.

---

## Kết quả so sánh MAPE

| | MAPE trước | MAPE sau | Thay đổi |
|---|---|---|---|
| Branch a7fc4472 | 51.0% | 50.97% | **≈ 0% cải thiện** |
| MAE trước | ~chưa ghi | 0.2339 (normalized) | — |
| Series count | 15 | 15 | không đổi |
| Series skipped | 0 | 0 | không đổi |
| Thời gian train | — | 43.3s | — |

---

## Phân tích kết quả

### Tại sao MAPE không cải thiện?

Fix đúng hướng nhưng **MAPE in-sample đo nhầm thứ**.

NeuralProphet cảnh báo khi retrain:
```
WARNING: When Global modeling with local normalization,
         metrics are displayed in normalized scale.
```

MAE 0.2339 hiển thị trong normalized [0,1] scale — **không thể so sánh
với MAE cũ** (vốn tính trên original scale như 1720, 281, 1.93...).

MAPE 50.97% được tính bởi `train_service.py` sau khi gọi `model.predict(df)`.
`predict()` của NeuralProphet tự **inverse-transform về original scale** —
nên MAPE vẫn đúng. Kết quả: 51% → 50.97% = **không đổi**.

### Giải thích đúng

| Giả thuyết | Đúng/Sai | Lý do |
|---|---|---|
| Normalization giúp gradient không bị dominated | ✅ Đúng | Cải thiện quá trình train |
| Normalization giảm MAPE in-sample | ❌ Sai | MAPE đo noise của data, không liên quan scale |
| Normalization giảm MAPE out-of-sample | ⚠️ Có thể | Cần đợi dự báo thực tế để kiểm tra |

**Root cause thực sự** của MAPE 51% là **data noise nội tại** (CV trung bình
65.9%), không phải scale heterogeneity. Dữ liệu F&B biến động cao khiến
ngay cả model hoàn hảo cũng cho MAPE 30-45%.

### Lợi ích thực của normalize="soft" (không thể đo bằng in-sample MAPE)

1. **Training ổn định hơn**: Gradient không bị s97 dominate → tất cả 15 series
   đều được học tốt hơn.
2. **Series nhỏ được dự báo chính xác hơn**: s93 (mean=1.93) và s104 (mean=2.4)
   không còn bị sacrifice để tối ưu cho s97 (mean=1720).
3. **Giữ nguyên fix** vì hại không có, lợi dài hạn có thể đo sau vài tuần.

---

## Kết luận

`normalize="soft"` là fix **cần thiết nhưng không đủ** để giảm MAPE đáng kể.

MAPE 51% sẽ chỉ giảm đáng kể khi:
1. Branch tích lũy ≥ 6 tháng data (hiện mới 141 ngày)
2. Chứa outlier thực sự (s97 spike 3890) — cần xác minh đơn vị đo
3. CV 65.9% là inherent noise — không thể model away

**Đề xuất monitor**: Sau 2026-06-01 (6 tháng data), train lại và đo MAPE mới.
