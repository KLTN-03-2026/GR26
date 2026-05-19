# Plan: test_train_service.py

**Ngày**: 2026-04-20
**File**: `tests/test_train_service.py`

## Mục tiêu

Viết unit tests cho `app/services/train_service.py` — kiểm tra logic lọc series,
quy trình train 1 branch, xử lý lỗi, seed ngẫu nhiên, và resilience khi một
branch/tenant thất bại.

## Phân tích implementation

| Hàm | Mô tả |
|---|---|
| `_filter_valid_series(df)` | Lọc series < MIN_DAYS_REQUIRED (30), trả `(df_filtered, skipped_ids)` |
| `validate_training_data(df)` | Kiểm tra df sau filter — empty / thiếu cột / NaN / âm |
| `_build_neuralprophet_model(config, n_lags, yearly)` | Khởi tạo NeuralProphet, đặt seed 42 |
| `train_branch_model(df, ...)` | Sync: filter → validate → build → fit → save → return dict |
| `run_train_for_branch(db, ...)` | Async: load config → fetch data → train → log → commit |
| `run_train_all_tenants(db)` | Async: lặp tenant → gọi `run_train_for_tenant` |

## Lưu ý quan trọng

- Không có `status="skipped"` trong `run_train_for_branch` — nếu dữ liệu không đủ
  sau filter, `validate_training_data` raise `ValueError` → caught → `status="failed"`.
- Lỗi được xử lý tại mức **branch** (trong `run_train_for_branch`), không mức tenant.
- Khi test `run_train_for_branch`, mock `train_branch_model` để tránh chạy
  NeuralProphet thật (chậm ~10s/call).

## Danh sách tests (8 tests)

| # | Test | Hàm kiểm tra |
|---|---|---|
| 1 | `test_filter_valid_series_all_sufficient` | `_filter_valid_series` — 2 series × 60 ngày → không bị skip |
| 2 | `test_filter_valid_series_some_insufficient` | `_filter_valid_series` — 1 đủ + 1 thiếu → skipped chứa ID ngắn |
| 3 | `test_filter_valid_series_all_insufficient` | `_filter_valid_series` — tất cả < 30 ngày → df rỗng |
| 4 | `test_run_train_for_branch_success` | `run_train_for_branch` — mock toàn bộ deps → status=success |
| 5 | `test_run_train_for_branch_all_series_too_short` | `run_train_for_branch` — data < 30 ngày → status=failed |
| 6 | `test_run_train_for_branch_db_error` | `run_train_for_branch` — data_service raise → status=failed, không re-raise |
| 7 | `test_manual_seed_is_set` | `_build_neuralprophet_model` — torch.manual_seed(42) và np.random.seed(42) được gọi |
| 8 | `test_run_train_all_tenants_one_branch_fails` | `run_train_all_tenants` — 1 branch failed không làm crash toàn bộ |

## File ảnh hưởng

- `tests/test_train_service.py` — tạo mới
