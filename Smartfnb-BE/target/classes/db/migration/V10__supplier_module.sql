-- =================================================================
-- V10: Supplier & Purchase Order Module (S-17)
-- =================================================================
-- Tables: suppliers, purchase_orders, purchase_order_items
-- =================================================================

-- Nhà cung cấp (Supplier)
CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    code            VARCHAR(50),
    contact_name    VARCHAR(100),
    phone           VARCHAR(20),
    email           VARCHAR(100),
    address         TEXT,
    tax_code        VARCHAR(20),
    note            TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_supplier_code_tenant UNIQUE (tenant_id, code)
);

CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX idx_suppliers_name   ON suppliers(tenant_id, name);

-- Đơn mua hàng (Purchase Order)
CREATE TABLE purchase_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    supplier_id     UUID NOT NULL REFERENCES suppliers(id),
    order_number    VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    -- DRAFT | SENT | RECEIVED | CANCELLED
    note            TEXT,
    expected_date   DATE,
    received_at     TIMESTAMP,
    cancelled_at    TIMESTAMP,
    cancel_reason   TEXT,
    total_amount    NUMERIC(18,4) NOT NULL DEFAULT 0,
    created_by      UUID NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_po_number_tenant UNIQUE (tenant_id, order_number),
    CONSTRAINT chk_po_status CHECK (status IN ('DRAFT','SENT','RECEIVED','CANCELLED'))
);

CREATE INDEX idx_po_tenant_branch  ON purchase_orders(tenant_id, branch_id);
CREATE INDEX idx_po_supplier       ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status         ON purchase_orders(tenant_id, status);

-- Chi tiết đơn mua hàng (Purchase Order Items)
CREATE TABLE purchase_order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id         UUID NOT NULL,        -- menu_items.id (nguyên liệu)
    item_name       VARCHAR(200) NOT NULL,
    unit            VARCHAR(50),
    quantity        NUMERIC(10,4) NOT NULL,
    unit_price      NUMERIC(12,4) NOT NULL DEFAULT 0,
    total_price     NUMERIC(18,4) NOT NULL DEFAULT 0,
    note            TEXT,
    CONSTRAINT chk_po_item_qty   CHECK (quantity > 0),
    CONSTRAINT chk_po_item_price CHECK (unit_price >= 0)
);

CREATE INDEX idx_po_items_po ON purchase_order_items(purchase_order_id);
