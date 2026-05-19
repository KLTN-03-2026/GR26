# Plan: Per-Branch Model + Train Config API

**Ngày:** 2026-04-17
**Feature:** Mỗi chi nhánh có model riêng + API cấu hình train per-branch

---

## Thay đổi kiến trúc

| | Trước | Sau |
|---|---|---|
| **Model** | 1 Global Model / tenant (tất cả branch gộp chung) | 1 model / branch (ingredient của branch đó) |
| **Path** | `storage/models/{tenant_id}/global_model.np` | `storage/models/{tenant_id}/{branch_id}/model.np` |
| **Config** | Hardcode trong Settings / .env | Per-branch trong bảng `ai_train_config` |
| **Train loop** | 1 lần / tenant | Lần lượt từng branch |
| **Fallback predict** | Moving average | Option C: skip + ghi status no_model |

---

## Config per-branch

| Field | Ý nghĩa | Mặc định |
|-------|---------|---------|
| `start_date` | Lấy data từ ngày nào (null = lấy tất cả từ đơn đầu tiên) | `null` |
| `n_lags` | Nhìn lại bao nhiêu ngày để học pattern | `14` |
| `n_forecasts` | Dự báo bao nhiêu ngày tới | `7` |
| `epochs` | Số vòng train | `100` |
| `weekly_seasonality` | Pattern cuối tuần | `true` |
| `yearly_seasonality` | **Auto-detect** khi branch có ≥ 730 ngày data | tự tính |

---

## File ảnh hưởng

| File | Loại | Thay đổi |
|------|------|---------|
| `alembic/versions/003_per_branch_config.py` | Tạo mới | Bảng ai_train_config + cột mới cho model_registry, train_logs |
| `app/models/train_config.py` | Tạo mới | SQLAlchemy model cho ai_train_config |
| `app/models/model_registry.py` | Sửa | Thêm branch_id, mape |
| `app/models/train_log.py` | Sửa | Thêm branch_id |
| `app/utils/model_io.py` | Sửa | Tất cả hàm nhận thêm branch_id |
| `app/services/data_service.py` | Sửa | Thêm get_branch_active_days, get_branch_train_config, get_consumption_for_branch, upsert_branch_train_config |
| `app/services/train_service.py` | Refactor lớn | Per-branch loop, đọc config từ DB |
| `app/schemas/train.py` | Sửa | Thêm TrainConfigRequest, TrainConfigResponse |
| `app/api/v1/train.py` | Sửa | Thêm GET/PUT /config, trigger retrain khi config thay đổi |
| `app/services/predict_service.py` | Sửa | Load model per-branch, Option C fallback |
| `scripts/e2e_test.py` | Sửa | Cập nhật list_all_models() API |

---

## Checklist

- [x] Plan file
- [x] Migration 003
- [x] SQLAlchemy models (TrainConfig mới, ModelRegistry + TrainLog update)
- [x] model_io.py per-branch
- [x] data_service.py additions
- [x] train_service.py refactor
- [x] schemas + API endpoints
- [x] predict_service.py Option C

---

## Trigger retrain khi nào

1. `PUT /api/v1/train/config?branch_id=...` → trigger retrain ngay cho branch đó (background)
2. Cron job Chủ nhật 2:00 AM → train tất cả branch theo config hiện tại
