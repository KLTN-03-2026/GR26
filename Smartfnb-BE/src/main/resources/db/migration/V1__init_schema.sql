-- ==============================================================================
-- Flyway Migration V1: Khởi tạo schema nền tảng SaaS SmartF&B
-- PostgreSQL 16 | SmartF&B v1.0
-- Tạo: plans, tenants — nền tảng cho multi-tenant
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==============================================================================
-- PHẦN 1: SAAS CORE — NỀN TẢNG PLATFORM
-- ==============================================================================

-- Gói dịch vụ SaaS (Basic / Standard / Premium)
CREATE TABLE IF NOT EXISTS plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    slug            VARCHAR(50)  NOT NULL UNIQUE,
    price_monthly   DECIMAL(12,2) NOT NULL CHECK (price_monthly >= 0),
    max_branches    INT NOT NULL DEFAULT 1,
    features        JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE plans IS 'Gói dịch vụ SaaS — Basic / Standard / Premium';
COMMENT ON COLUMN plans.features IS 'Cấu hình feature flag: {"POS": true, "INVENTORY": true, "PROMOTION": false}';

-- Chuỗi / Thương hiệu F&B (mỗi chủ quán là 1 tenant)
CREATE TABLE IF NOT EXISTS tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id         UUID REFERENCES plans(id) ON DELETE RESTRICT,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) UNIQUE,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    tax_code        VARCHAR(50),
    logo_url        TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    plan_expires_at TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tenants IS 'Tenant = chuỗi F&B độc lập (chủ quán đăng ký)';
COMMENT ON COLUMN tenants.status IS 'ACTIVE | SUSPENDED | CANCELLED';

-- ==============================================================================
-- PHẦN 2: XÁC THỰC & NGƯỜI DÙNG
-- ==============================================================================

-- Tất cả tài khoản người dùng
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
    full_name           VARCHAR(255) NOT NULL,
    email               VARCHAR(255),
    phone               VARCHAR(20),
    password_hash       VARCHAR(255),
    pos_pin             VARCHAR(255),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    failed_login_count  INT DEFAULT 0,
    locked_until        TIMESTAMP,
    last_login_at       TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email_tenant UNIQUE (tenant_id, email),
    CONSTRAINT uq_users_phone_tenant UNIQUE (tenant_id, phone)
);

COMMENT ON TABLE users IS 'Tài khoản hệ thống: Owner, Admin, Cashier, Barista, Waiter...';
COMMENT ON COLUMN users.status IS 'ACTIVE | INACTIVE | LOCKED';
COMMENT ON COLUMN users.pos_pin IS 'Hashed PIN đăng nhập POS nhanh';

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- OTP cho quên mật khẩu / xác thực email
CREATE TABLE IF NOT EXISTS otp_records (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    otp_hash    VARCHAR(255) NOT NULL,
    purpose     VARCHAR(30)  NOT NULL,
    expires_at  TIMESTAMP    NOT NULL,
    is_used     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN otp_records.purpose IS 'RESET_PASSWORD | VERIFY_EMAIL';

CREATE INDEX IF NOT EXISTS idx_otp_user_purpose ON otp_records(user_id, purpose, is_used)
    WHERE is_used = FALSE;

-- ==============================================================================
-- PHẦN 3: CHI NHÁNH & PHÂN CÔNG NHÂN VIÊN
-- ==============================================================================

CREATE TABLE IF NOT EXISTS branches (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    code                VARCHAR(50)  NOT NULL,
    address             TEXT,
    latitude            DECIMAL(10,7),
    longitude           DECIMAL(10,7),
    phone               VARCHAR(20),
    manager_user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_branch_code_tenant UNIQUE (tenant_id, code)
);

COMMENT ON COLUMN branches.status IS 'ACTIVE | INACTIVE | TEMPORARILY_CLOSED';
CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);

-- Nhân viên được phân công vào chi nhánh
CREATE TABLE IF NOT EXISTS branch_users (
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES branches(id) ON DELETE CASCADE,
    is_primary_branch   BOOLEAN DEFAULT TRUE,
    assigned_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_branch_users_branch ON branch_users(branch_id);

-- ==============================================================================
-- PHẦN 4: HỆ THỐNG PHÂN QUYỀN ĐỘNG (RBAC)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS permissions (
    id          VARCHAR(60) PRIMARY KEY,
    module      VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS roles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    CONSTRAINT uq_role_name_tenant UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id         UUID    REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   VARCHAR(60) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id     UUID REFERENCES users(id)  ON DELETE CASCADE,
    role_id     UUID REFERENCES roles(id)  ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id)   ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id   UUID,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  INET,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id);

-- ==============================================================================
-- SEED DATA: PERMISSIONS
-- ==============================================================================

INSERT INTO permissions (id, module, description) VALUES
('ORDER_VIEW',          'POS',          'Xem danh sách đơn hàng'),
('ORDER_CREATE',        'POS',          'Tạo đơn hàng mới'),
('ORDER_UPDATE',        'POS',          'Cập nhật trạng thái đơn hàng'),
('ORDER_CANCEL',        'POS',          'Hủy đơn hàng'),
('PAYMENT_CREATE',      'PAYMENT',      'Thực hiện thanh toán'),
('PAYMENT_REFUND',      'PAYMENT',      'Hoàn tiền'),
('INVOICE_VIEW',        'PAYMENT',      'Xem hóa đơn'),
('INVOICE_PRINT',       'PAYMENT',      'In / gửi lại hóa đơn'),
('MENU_VIEW',           'MENU',         'Xem thực đơn'),
('MENU_EDIT',           'MENU',         'Thêm / sửa / vô hiệu hóa món'),
('INVENTORY_VIEW',      'INVENTORY',    'Xem tồn kho'),
('INVENTORY_IMPORT',    'INVENTORY',    'Nhập kho'),
('INVENTORY_ADJUST',    'INVENTORY',    'Điều chỉnh kho thủ công'),
('INVENTORY_WASTE',     'INVENTORY',    'Ghi nhận hao hụt'),
('STAFF_VIEW',          'HR',           'Xem danh sách nhân viên'),
('STAFF_EDIT',          'HR',           'Thêm / sửa / khóa nhân viên'),
('SHIFT_VIEW',          'HR',           'Xem lịch ca'),
('SHIFT_REGISTER',      'HR',           'Đăng ký ca làm việc'),
('SHIFT_MANAGE',        'HR',           'Quản lý ca (tạo / phân công)'),
('PROMOTION_VIEW',      'PROMOTION',    'Xem khuyến mãi và voucher'),
('PROMOTION_EDIT',      'PROMOTION',    'Tạo / sửa chương trình khuyến mãi'),
('VOUCHER_APPLY',       'PROMOTION',    'Áp dụng voucher vào đơn hàng'),
('SUPPLIER_VIEW',       'SUPPLIER',     'Xem nhà cung cấp'),
('SUPPLIER_EDIT',       'SUPPLIER',     'Thêm / sửa nhà cung cấp'),
('PURCHASE_ORDER_EDIT', 'SUPPLIER',     'Tạo / duyệt đơn đặt hàng'),
('REPORT_REVENUE',      'REPORT',       'Xem báo cáo doanh thu'),
('REPORT_INVENTORY',    'REPORT',       'Xem báo cáo kho'),
('REPORT_HR',           'REPORT',       'Xem báo cáo nhân sự'),
('REPORT_EXPORT',       'REPORT',       'Xuất báo cáo Excel / PDF'),
('BRANCH_EDIT',         'SYSTEM',       'Thêm / sửa chi nhánh'),
('PERMISSION_EDIT',     'SYSTEM',       'Thay đổi phân quyền vai trò')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SEED DATA: PLANS MẶC ĐỊNH
-- ==============================================================================

INSERT INTO plans (id, name, slug, price_monthly, max_branches, features, is_active)
VALUES
    (uuid_generate_v4(), 'Basic',    'basic',    299000,  1, '{"POS":true,"INVENTORY":false,"PROMOTION":false,"AI":false}', true),
    (uuid_generate_v4(), 'Standard', 'standard', 599000,  3, '{"POS":true,"INVENTORY":true,"PROMOTION":true,"AI":false}',  true),
    (uuid_generate_v4(), 'Premium',  'premium',  1299000, 10,'{"POS":true,"INVENTORY":true,"PROMOTION":true,"AI":true}',   true)
ON CONFLICT (slug) DO NOTHING;
