# Plan: Hoàn thiện app/utils/model_io.py
> Ngày: 2026-04-15 | Session 4 — TASK A

## Mục tiêu

Nâng cấp `model_io.py` từ bản skeleton (3 functions) thành bản đầy đủ (5 functions):
- `save_model` — thêm `series_count` + ghi `train_metadata.json`
- `load_model` — đổi về `object | None`, xử lý corrupt file
- `model_exists` — giữ nguyên
- `get_train_metadata` — **mới** — đọc metadata.json
- `list_all_models` — **mới** — liệt kê tenant có model

## Files bị ảnh hưởng

| File | Thay đổi |
|------|----------|
| `app/utils/model_io.py` | Sửa + thêm functions |
| `tests/test_model_io.py` | Tạo mới — ~20 tests |

## Checklist

- [ ] `save_model(model, tenant_id, series_count=0) -> Path`
  - Ghi `train_metadata.json` sau khi save .np
  - metadata: trained_at (UTC ISO), tenant_id, series_count, model_path
- [ ] `load_model(tenant_id) -> object | None`
  - Return None nếu file không tồn tại
  - Corrupt file → log error + xóa .np + xóa metadata.json + return None
- [ ] `get_train_metadata(tenant_id) -> dict | None`
  - Đọc JSON, None nếu không có / parse lỗi
- [ ] `list_all_models() -> list[str]`
  - Scan MODEL_DIR, trả về danh sách tenant_id có global_model.np
- [ ] Tests đầy đủ dùng `tmp_path` + mock neuralprophet

## Test matrix

| Test | Mô tả |
|------|-------|
| `test_save_creates_np_file` | File .np tồn tại sau save |
| `test_save_creates_metadata` | metadata.json có đúng keys |
| `test_save_metadata_series_count` | series_count được ghi đúng |
| `test_load_returns_none_missing` | File không tồn tại → None |
| `test_load_returns_model` | Load thành công → trả model |
| `test_load_corrupt_returns_none` | Corrupt → None |
| `test_load_corrupt_deletes_files` | File .np + metadata.json bị xóa sau corrupt |
| `test_model_exists_true` | File tồn tại → True |
| `test_model_exists_false` | Chưa có file → False |
| `test_get_metadata_returns_dict` | metadata.json tồn tại → dict đúng |
| `test_get_metadata_missing` | Không có file → None |
| `test_get_metadata_invalid_json` | JSON lỗi → None + log warning |
| `test_list_all_models_empty` | Chưa có gì → [] |
| `test_list_all_models_multiple` | Nhiều tenant → list đúng |
| `test_list_all_models_only_with_np` | Folder không có .np không được liệt kê |
