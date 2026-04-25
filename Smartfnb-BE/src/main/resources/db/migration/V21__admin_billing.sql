-- ==============================================================================
-- Flyway Migration V21: Admin Billing — Hóa đơn Gói Dịch Vụ
-- PostgreSQL 16 | SmartF&B SaaS Admin Module
-- Tạo bảng subscription_invoices để lưu lịch sử thanh toán gói của tenant.
-- Thêm permissions mới cho SYSTEM_ADMIN.
-- ==============================================================================

-- 1. Bảng hóa đơn gói dịch vụ (subscription_invoices)
--    Bất biến sau khi tạo: chỉ cập nhật status (UNPAID → PAID | CANCELLED)
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant sở hữu hóa đơn này
    tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,

    -- Subscription đang được gia hạn bởi hóa đơn này
    subscription_id      UUID NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,

    -- Gói dịch vụ tại thời điểm tạo hóa đơn (snapshot)
    plan_id              UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,

    -- Mã hóa đơn, bất biến: INV-YYYYMM-00001
    invoice_number       VARCHAR(50) UNIQUE NOT NULL,

    -- Số tiền phải thanh toán
    amount               DECIMAL(12,2) NOT NULL CHECK (amount >= 0),

    -- Chu kỳ dịch vụ được gia hạn
    billing_period_start DATE NOT NULL,
    billing_period_end   DATE NOT NULL,

    -- Trạng thái thanh toán: UNPAID | PAID | CANCELLED
    status               VARCHAR(20) NOT NULL DEFAULT 'UNPAID',

    -- Phương thức thanh toán (điền sau khi admin xác nhận)
    payment_method       VARCHAR(30),

    -- Thời điểm xác nhận đã thanh toán
    paid_at              TIMESTAMP,

    -- Ghi chú từ admin
    note                 TEXT,

    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_invoice_period CHECK (billing_period_end > billing_period_start)
);

-- Index tìm kiếm hóa đơn theo tenant (thường dùng nhất)
CREATE INDEX IF NOT EXISTS idx_sub_invoices_tenant
    ON subscription_invoices(tenant_id, created_at DESC);

-- Index tìm kiếm hóa đơn chưa thanh toán (admin giám sát)
CREATE INDEX IF NOT EXISTS idx_sub_invoices_status
    ON subscription_invoices(status, created_at DESC)
    WHERE status = 'UNPAID';

-- Index tra cứu theo subscription
CREATE INDEX IF NOT EXISTS idx_sub_invoices_subscription
    ON subscription_invoices(subscription_id);

-- ==============================================================================
-- 2. Bổ sung permissions mới cho SYSTEM_ADMIN
-- ==============================================================================
INSERT INTO permissions (id, module, description) VALUES
    ('TENANT_VIEW',    'ADMIN', 'Xem danh sách và chi tiết tenant'),
    ('TENANT_MANAGE',  'ADMIN', 'Suspend/Reactivate/Đổi gói cho tenant'),
    ('BILLING_VIEW',   'ADMIN', 'Xem hóa đơn gói dịch vụ'),
    ('BILLING_MANAGE', 'ADMIN', 'Tạo/xác nhận/hủy hóa đơn gói dịch vụ')
ON CONFLICT (id) DO NOTHING;
