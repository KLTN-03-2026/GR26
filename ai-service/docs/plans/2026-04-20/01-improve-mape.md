# Improve MAPE — 3 thay đổi theo thứ tự ưu tiên

**Ngày:** 2026-04-20
**Mục tiêu:** Giảm MAPE từ baseline ~51% xuống thấp hơn bằng cách xử lý outlier, tăng context window, và nâng ngưỡng data tối thiểu.

---

## Checklist

- [ ] THAY ĐỔI 1: Clip outliers per-series (IQR × 3.0)
- [ ] THAY ĐỔI 2: Tăng n_lags default lên 28, epochs=150, batch_size=16
- [ ] THAY ĐỔI 3: Nâng MIN_DAYS_REQUIRED lên 90
- [ ] Retrain và ghi MAPE mới vào dev-notes
- [ ] Chạy pytest — kỳ vọng pass hết

---

## Thay đổi 1 — Clip outliers (`dataframe_builder.py`)

**Vấn đề:** Spike tiêu thụ cực đoan (sự kiện đặc biệt, nhập liệu sai) khiến MSE/Huber loss bị dominated bởi vài ngày bất thường → model học pattern sai.

**Giải pháp:** `clip_outliers_per_series()` — dùng IQR × 3.0 để giới hạn upper_bound theo từng series. Lower bound không clip (không muốn cắt ngày 0 tiêu thụ hợp lệ).

**File thay đổi:**
- `app/utils/dataframe_builder.py` — thêm hàm `clip_outliers_per_series()`
- `app/services/train_service.py` — gọi trong `train_branch_model()` trước `model.fit()`

---

## Thay đổi 2 — Tăng n_lags, epochs, giảm batch_size

**Vấn đề:**
- `n_lags=14` (default): chỉ nhìn lại 2 tuần → bỏ sót pattern tháng.
- `epochs=100`: có thể chưa hội tụ khi data phức tạp hơn.
- `batch_size=32`: batch lớn → gradient noisy hơn trên data ít.

**Giải pháp:**
- `np_n_lags: int = 28` trong config.py (tham chiếu, thực tế dùng `_auto_n_lags()`)
- `np_epochs: int = 150` trong config.py
- `np_batch_size: int = 16` thêm mới trong config.py
- `batch_size=16` trong `_build_neuralprophet_model()`
- `.env.example` cập nhật tương ứng

**File thay đổi:**
- `app/core/config.py`
- `app/services/train_service.py`
- `.env.example`

---

## Thay đổi 3 — Nâng MIN_DAYS_REQUIRED = 90

**Vấn đề:** `n_lags=28` cần ít nhất 3× = 84 ngày để train có ý nghĩa. Với `MIN_DAYS_REQUIRED=30`, branch chỉ 30 ngày data sẽ được train với n_lags không phù hợp → kết quả kém.

**Giải pháp:** `MIN_DAYS_REQUIRED = 90` — đảm bảo mọi series đều có đủ context cho `n_lags` lớn nhất.

**File thay đổi:**
- `app/services/train_service.py` — constant `MIN_DAYS_REQUIRED`
- `app/core/config.py` — thêm `np_min_days_required: int = 90`
- `.env.example` — thêm `NP_MIN_DAYS_REQUIRED=90`

---

## MAPE tracking

| Thay đổi | MAPE |
|---|---|
| Baseline | 51.0% |
| + normalize="soft" | 50.97% |
| + clip outliers | ? |
| + n_lags=28, epochs=150 | ? |

---

## Files ảnh hưởng

| File | Thay đổi |
|---|---|
| `app/utils/dataframe_builder.py` | Thêm `clip_outliers_per_series()` |
| `app/services/train_service.py` | Gọi clip, đổi batch_size, MIN_DAYS_REQUIRED |
| `app/core/config.py` | Thêm np_batch_size, np_min_days_required; cập nhật np_n_lags, np_epochs |
| `.env.example` | Cập nhật NP_* |
