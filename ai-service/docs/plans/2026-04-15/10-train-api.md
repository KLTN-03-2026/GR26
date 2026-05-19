# Plan: app/api/v1/train.py — 3 endpoints + background task
> Ngày: 2026-04-15 | Session 5 — TASK C

## 3 Items

| | Path/Type | Mô tả |
|-|-----------|-------|
| 1 | POST `/train/trigger` | Trigger train thủ công — chỉ OWNER/ADMIN |
| 2 | GET `/train/status` | Trạng thái lần train gần nhất của tenant |
| 3 | Function `run_train_background` | Background task wrapper |

## Luồng trigger

```
POST /train/trigger
  → Kiểm tra role (OWNER | ADMIN)
  → Đọc tenant_id từ body (nếu có) hoặc JWT
  → background_tasks.add_task(run_train_background, tenant_id)
  → Return TrainTriggerResponse ngay (non-blocking)
```

## Luồng status

```
GET /train/status
  → Lấy tenant_id từ JWT
  → Query TrainLog: SELECT ... FROM train_logs WHERE tenant_id = :tenant_id ORDER BY started_at DESC LIMIT 1
  → model_io.model_exists(tenant_id) → model_exists: bool
  → Return TrainStatusResponse
```

## Background task

```python
async def run_train_background(tenant_id: str) -> None:
    async with AsyncSessionLocal() as db:
        try:
            await train_service.run_train_for_tenant(db, tenant_id, trigger_type="manual")
        except Exception as exc:
            logger.error(...)
```

## Files bị ảnh hưởng
| File | Thay đổi |
|------|----------|
| `app/api/v1/train.py` | Implement 3 items |
| `app/main.py` | Router đã mount ✅ |

## Lưu ý
- KHÔNG dùng `Depends(get_db)` trong background task — tạo session riêng với `AsyncSessionLocal()`
- `train_service.run_train_for_tenant` cần kiểm tra signature — đọc train_service.py trước khi gọi
