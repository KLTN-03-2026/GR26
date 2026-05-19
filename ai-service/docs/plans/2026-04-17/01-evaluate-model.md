# Plan: Model Evaluation — Fix MAE + Visualize

**Ngày:** 2026-04-17
**Feature:** Đánh giá model NeuralProphet — fix seed, tạo evaluate script, lưu MAPE

---

## Mục tiêu

1. **Fix MAE không ổn định** — đặt random seed trước khi khởi tạo NeuralProphet
2. **Script đánh giá** — `scripts/evaluate_model.py` với chart train/val loss + forecast vs actual
3. **Lưu MAPE** vào `train_metadata.json` — dễ hiểu hơn MAE thuần túy
4. **API status** — trả về `mape` trong `GET /api/v1/train/status`

---

## File ảnh hưởng

| File | Thay đổi |
|------|----------|
| `app/services/train_service.py` | Di chuyển seed trước NeuralProphet(); tính MAPE sau fit |
| `app/utils/model_io.py` | `save_model()` nhận thêm `mape` param; lưu vào metadata JSON |
| `app/schemas/train.py` | `TrainStatusResponse` thêm field `mape: float \| None` |
| `app/api/v1/train.py` | GET /status đọc mape từ train_metadata.json |
| `scripts/evaluate_model.py` | **Tạo mới** — script đánh giá offline |
| `requirements.txt` | Thêm `matplotlib` nếu chưa có |

---

## Checklist

- [x] Tạo plan file
- [x] PHẦN 1 — Fix seed placement trong `_build_neuralprophet_model()`
- [x] PHẦN 2 — Tạo `scripts/evaluate_model.py`
- [x] PHẦN 3 — Tính và lưu MAPE vào train_metadata.json
- [x] PHẦN 4 — Thêm `mape` vào TrainStatusResponse + GET /status endpoint
- [x] Thêm `matplotlib` vào requirements.txt

---

## Ghi chú kỹ thuật

- MAPE formula: `mean(|actual - predicted| / (actual + 1)) × 100` (cộng 1 tránh chia 0)
- Seed phải đặt **trước** `NeuralProphet(...)` để ảnh hưởng đến weight init
- Script dùng `matplotlib.use('Agg')` — không cần display, lưu thẳng PNG
- Train/test split theo thời gian (80/20) — KHÔNG random
- Overfit check: `ratio = MAEval / MAE_train` — ngưỡng 1.2/1.5
