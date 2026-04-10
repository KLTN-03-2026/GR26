-- =================================================================
-- V7: Inventory Module (S-13 & S-14)
-- =================================================================
-- Tables: inventory_balances, stock_batches, inventory_transactions
-- Triggers: FIFO index, partial low-stock index, audit_logs update
-- =================================================================

-- Tồn kho hiện tại theo chi nhánh (1 dòng = 1 nguyên liệu tại 1 chi nhánh)
CREATE TABLE inventory_balances (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
    branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    item_id     UUID NOT NULL REFERENCES items(id)    ON DELETE RESTRICT,
    item_name   VARCHAR(255),                          -- Snapshot tên nguyên liệu (tránh JOIN khi query)
    unit        VARCHAR(30),                           -- Đơn vị tính (g, ml, kg, cái...)
    quantity    DECIMAL(10,4) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_level   DECIMAL(10,4) NOT NULL DEFAULT 0,     -- Ngưỡng cảnh báo sắp hết
    version     BIGINT NOT NULL DEFAULT 0,            -- Optimistic locking
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_inventory_branch_item UNIQUE (branch_id, item_id)
);

CREATE INDEX idx_inventory_branch       ON inventory_balances(branch_id);
CREATE INDEX idx_inventory_tenant       ON inventory_balances(tenant_id);

-- Partial index: cảnh báo khi tồn kho dưới ngưỡng (S-14 trigger)
CREATE INDEX idx_inventory_low_stock ON inventory_balances(branch_id, item_id)
    WHERE quantity <= min_level;


-- Lô hàng nhập kho (hỗ trợ xuất kho FIFO + theo dõi hạn sử dụng)
CREATE TABLE stock_batches (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id)  ON DELETE CASCADE,
    item_id             UUID NOT NULL REFERENCES items(id)     ON DELETE RESTRICT,
    supplier_id         UUID,                          -- FK tới suppliers sẽ thêm khi implement module Supplier
    quantity_initial    DECIMAL(10,4) NOT NULL CHECK (quantity_initial > 0),
    quantity_remaining  DECIMAL(10,4) NOT NULL CHECK (quantity_remaining >= 0),
    cost_per_unit       DECIMAL(12,4) NOT NULL DEFAULT 0 CHECK (cost_per_unit >= 0),
    imported_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at          TIMESTAMP,             -- Cảnh báo hết hạn
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index FIFO: ưu tiên lô nhập SỚM NHẤT còn hàng khi xuất kho
CREATE INDEX idx_batches_fifo ON stock_batches(branch_id, item_id, imported_at ASC)
    WHERE quantity_remaining > 0;

-- Index cảnh báo hết hạn
CREATE INDEX idx_batches_expiry ON stock_batches(branch_id, expires_at ASC)
    WHERE quantity_remaining > 0 AND expires_at IS NOT NULL;

CREATE INDEX idx_batches_branch ON stock_batches(branch_id);
CREATE INDEX idx_batches_tenant ON stock_batches(tenant_id);


-- Lịch sử mọi biến động kho (nhập / xuất / trừ bán / hao hụt / điều chỉnh)
CREATE TABLE inventory_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
    branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    item_id         UUID NOT NULL REFERENCES items(id)    ON DELETE RESTRICT,
    user_id         UUID REFERENCES users(id)             ON DELETE SET NULL,
    batch_id        UUID REFERENCES stock_batches(id)     ON DELETE SET NULL,
    type            VARCHAR(20) NOT NULL,
    -- IMPORT | SALE_DEDUCT | WASTE | ADJUSTMENT
    quantity        DECIMAL(10,4) NOT NULL,      -- Dương = nhập, Âm = xuất
    cost_per_unit   DECIMAL(12,4),
    reference_id    UUID,                        -- order_id hoặc purchase_order_id
    reference_type  VARCHAR(30),                 -- ORDER | MANUAL
    note            VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_inv_trans_type CHECK (type IN ('IMPORT', 'SALE_DEDUCT', 'WASTE', 'ADJUSTMENT'))
);

CREATE INDEX idx_inv_trans_branch_item ON inventory_transactions(branch_id, item_id, created_at DESC);
CREATE INDEX idx_inv_trans_type        ON inventory_transactions(branch_id, type, created_at DESC);
CREATE INDEX idx_inv_trans_tenant      ON inventory_transactions(tenant_id, created_at DESC);
CREATE INDEX idx_inv_trans_ref        ON inventory_transactions(reference_id) WHERE reference_id IS NOT NULL;

-- =================================================================
-- BUSINESS RULES (enforced at application level):
-- 1. FIFO: khi xuất kho → lấy batch có imported_at nhỏ nhất còn quantity_remaining > 0
-- 2. Low Stock Alert: quantity <= min_level → publish LowStockAlertEvent
-- 3. AdjustStock: bắt buộc ghi vào audit_logs và inventory_transactions
-- 4. WasteRecord: ghi inventory_transactions với type=WASTE và quantity âm
-- 5. SALE_DEDUCT: triggered bởi OrderCompletedEvent, quantity âm theo Recipe
-- =================================================================
