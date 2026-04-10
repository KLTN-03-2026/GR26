-- ==============================================================================
-- Flyway Migration V2: Bổ sung các cột Audit và Role Hệ Thống, tạo bảng Subscriptions
-- PostgreSQL 16 | SmartF&B v1.1
-- Giải quyết lỗi: missing column [assigned_at], missing column [is_system], missing table [subscriptions]
-- Không được phép sửa V1 để tránh lỗi Checksum mismatch
-- ==============================================================================

-- 1. Bảng roles: Thêm is_system để đánh dấu OWNER, ADMIN... (không cho phép xóa)
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- 2. Bảng user_roles: Thêm thông tin Audit ai gán quyền và vào lúc nào
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. Tạo bảng subscriptions để lưu lịch sử gói dịch vụ của Tenant
CREATE TABLE IF NOT EXISTS subscriptions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id     UUID NOT NULL REFERENCES plans(id)   ON DELETE RESTRICT,
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    -- ACTIVE | EXPIRED | CANCELLED
    started_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at  TIMESTAMP,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status ON subscriptions(tenant_id, status);
