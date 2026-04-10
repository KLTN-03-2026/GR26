-- =================================================================
-- V8: Staff Module (S-15)
-- =================================================================
-- Tables: positions, staff (dùng bảng users + branch_users đã có)
-- roles, permissions, role_permissions đã có từ V1/V2
-- Thêm cột position_id vào users, seed permissions HR
-- =================================================================

-- Chức vụ nhân viên theo tenant (Ba Trưởng ca, Thu Ngân, Pha chế...)
CREATE TABLE positions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_position_name_tenant UNIQUE (tenant_id, name)
);
CREATE INDEX idx_positions_tenant ON positions(tenant_id) WHERE is_active = TRUE;

-- Thêm cột position_id và các trường HR vào bảng users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS hire_date DATE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Index cho soft delete và tra cứu
CREATE INDEX IF NOT EXISTS idx_users_tenant_active ON users(tenant_id)
    WHERE deleted_at IS NULL AND status = 'ACTIVE';

-- Đảm bảo unique employee_code trong tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_code_tenant
    ON users(tenant_id, employee_code)
    WHERE employee_code IS NOT NULL AND deleted_at IS NULL;

-- =================================================================
-- Seed permissions còn thiếu cho Staff & Permission management
-- (Một số đã seed trong V1, chỉ thêm nếu chưa có)
-- =================================================================
INSERT INTO permissions (id, module, description) VALUES
('ROLE_VIEW',           'SYSTEM', 'Xem danh sách vai trò và phân quyền'),
('ROLE_EDIT',           'SYSTEM', 'Tạo / sửa vai trò')
ON CONFLICT (id) DO NOTHING;

-- Đảm bảo PERMISSION_EDIT đã có (đã seed trong V1)
INSERT INTO permissions (id, module, description) VALUES
('PERMISSION_EDIT', 'SYSTEM', 'Thay đổi phân quyền vai trò')
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- BUSINESS RULES:
-- 1. phone unique trong tenant (ràng buộc uq_users_phone_tenant trong V1)
-- 2. Mọi thay đổi role_permissions → ghi audit_log với action=PERMISSION_CHANGED
-- 3. Xóa staff → soft delete (deleted_at), không xóa cứng
-- 4. employee_code unique trong tenant nếu được đặt
-- =================================================================
