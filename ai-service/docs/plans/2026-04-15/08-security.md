# Plan: app/core/security.py + app/api/deps.py
> Ngày: 2026-04-15 | Session 5 — TASK A

## Phân tích hiện trạng

### security.py
- `TokenPayload` — có user_id, tenant_id, role, branch_id; **thiếu** `permissions`
- `verify_token` — raise `ValueError` thay vì `HTTPException` → spec yêu cầu raise trực tiếp

### deps.py
- `get_current_tenant` ✅ — nhưng cần cập nhật khi security.py đổi behavior
- `verify_branch_access` — **chưa có**

## Thay đổi cần làm

### security.py
1. Add `permissions: list[str] = field(default_factory=list)` vào `TokenPayload`
2. Import `HTTPException`, `status` từ fastapi
3. `verify_token`:
   - JWTError → `HTTPException(401, "Token không hợp lệ hoặc đã hết hạn")`
   - Thiếu tenant_id → `HTTPException(403, "Token thiếu tenant_id")`
   - Xử lý cả `tenantId` (camelCase) và `tenant_id` (snake_case)
   - Xử lý `permissions` (list, default [])

### deps.py
1. `get_current_tenant` — bỏ try/except (security.py đã raise HTTPException trực tiếp)
2. Add `verify_branch_access`:
   - `SELECT 1 FROM branches WHERE id::text = :branch_id AND tenant_id = :tenant_id`
   - 403 nếu không tìm thấy

## Test matrix (tests/test_security.py)

| Test | Mô tả |
|------|-------|
| `test_valid_token_returns_payload` | Decode thành công → TokenPayload đúng |
| `test_valid_token_with_permissions` | permissions list được map đúng |
| `test_tenant_id_camelcase` | `tenantId` được nhận diện |
| `test_expired_token_raises_401` | JWTError → HTTPException 401 |
| `test_wrong_secret_raises_401` | JWTError (signature) → HTTPException 401 |
| `test_missing_tenant_id_raises_403` | Không có tenantId/tenant_id → HTTPException 403 |

## Ghi chú kiến trúc
- Security.py raise HTTPException trực tiếp → gọn hơn, FastAPI hiểu natively
- branches.id trong BE là UUID → dùng `id::text` khi compare với string từ JWT
