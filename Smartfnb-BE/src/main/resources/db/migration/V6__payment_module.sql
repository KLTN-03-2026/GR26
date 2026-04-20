-- =================================================================
-- V6: Payment Module (S-11 & S-12)
-- =================================================================
-- Tables: payments, invoices, invoice_items
-- =================================================================

-- Tạo bảng payments (Thanh toán)
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID REFERENCES tenants(id)  ON DELETE CASCADE,
    order_id            UUID REFERENCES orders(id)   ON DELETE RESTRICT,
    
    amount              DECIMAL(12,2) NOT NULL,
    method              VARCHAR(20) NOT NULL,           -- CASH, VIETQR, MOMO, ZALOPAY
    status              VARCHAR(20) NOT NULL,           -- PENDING, COMPLETED, FAILED, CANCELLED, REFUNDED
    transaction_id      VARCHAR(255),                   -- External transaction ID từ payment gateway
    
    cashier_user_id     UUID REFERENCES users(id)    ON DELETE SET NULL,
    qr_expires_at       TIMESTAMP,                      -- Hết hạn QR (now + 180s)
    paid_at             TIMESTAMP,                      -- Thời gian thanh toán thực tế
    
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version             BIGINT NOT NULL DEFAULT 0,
    
    CONSTRAINT ck_payment_method CHECK (method IN ('CASH', 'VIETQR', 'MOMO', 'ZALOPAY')),
    CONSTRAINT ck_payment_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'))
);

CREATE INDEX idx_payments_order        ON payments(order_id);
CREATE INDEX idx_payments_tenant       ON payments(tenant_id, created_at DESC);

-- Constraint: Mỗi order chỉ có 1 payment COMPLETED
CREATE UNIQUE INDEX uq_payments_order_completed 
ON payments(order_id) WHERE status = 'COMPLETED';


-- Tạo bảng invoices (Hóa đơn)
CREATE TABLE invoices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID REFERENCES tenants(id)  ON DELETE CASCADE,
    branch_id           UUID REFERENCES branches(id) ON DELETE CASCADE,
    order_id            UUID REFERENCES orders(id)   ON DELETE RESTRICT,
    payment_id          UUID REFERENCES payments(id) ON DELETE RESTRICT,
    
    invoice_number      VARCHAR(50) NOT NULL UNIQUE,
    
    subtotal            DECIMAL(12,2) NOT NULL,
    discount            DECIMAL(12,2),
    tax_amount          DECIMAL(12,2),
    total               DECIMAL(12,2) NOT NULL,
    
    issued_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_branch_date  ON invoices(branch_id, issued_at DESC);
CREATE INDEX idx_invoices_tenant_date  ON invoices(tenant_id, issued_at DESC);
CREATE INDEX idx_invoices_order        ON invoices(order_id);
CREATE INDEX idx_invoices_payment      ON invoices(payment_id);
CREATE INDEX idx_invoices_number       ON invoices(invoice_number);


-- Tạo bảng invoice_items (Chi tiết hóa đơn)
-- NOTE: menu_item_id is NOT a foreign key (cache pattern)
-- We store menu item snapshot at invoice creation time, so item can be deleted from Menu
-- but invoice remains valid with cached data (CQRS pattern)
CREATE TABLE invoice_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    item_name           VARCHAR(255) NOT NULL,
    quantity            INTEGER NOT NULL,
    unit_price          DECIMAL(12,2) NOT NULL,
    total_price         DECIMAL(12,2) NOT NULL,
    
    CONSTRAINT ck_invoice_item_quantity CHECK (quantity > 0),
    CONSTRAINT ck_invoice_item_price CHECK (unit_price >= 0)
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);


-- =================================================================
-- CONSTRAINTS & BUSINESS RULES
-- =================================================================

-- 1. Payment COMPLETED → Invoice ACTIVE (tạo tự động qua InvoiceCreatedEventListener)
-- 2. invoice_number là UNIQUE (Tenant + Branch + Day + Daily Counter)
-- 3. QR Payment expires sau 180 giây (validate qua code)
-- 4. Search Invoice giới hạn 90 ngày (validate qua query)
-- 5. Invoice không thể sửa (chỉ VOID, không DELETE)
-- 6. Mỗi Order chỉ có 1 Payment COMPLETED (Unique Index)

-- =================================================================
-- SAMPLE DATA (nếu cần test)
-- =================================================================
-- INSERT INTO payments (tenant_id, branch_id, order_id, user_id, payment_method, amount, status, created_at, created_by)
-- SELECT 
--     t.id, b.id, o.id, u.id,
--     'CASH', 250000, 'COMPLETED', now(), u.id
-- FROM tenants t, branches b, orders o, users u
-- WHERE t.name = 'SmartF&B' AND b.name = 'Chi nhánh Tây Sơn' 
--   AND o.order_number = 'ORD-001' AND u.username = 'cashier1'
-- LIMIT 1;
