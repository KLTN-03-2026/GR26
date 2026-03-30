-- Tạo bảng pos_sessions (Phiên giao dịch POS)
CREATE TABLE pos_sessions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID REFERENCES tenants(id)  ON DELETE CASCADE,
    branch_id               UUID REFERENCES branches(id) ON DELETE CASCADE,
    opened_by_user_id       UUID REFERENCES users(id)    ON DELETE RESTRICT,
    closed_by_user_id       UUID REFERENCES users(id)    ON DELETE SET NULL,
    start_time              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time                TIMESTAMP,
    starting_cash           DECIMAL(12,2) DEFAULT 0,
    ending_cash_expected    DECIMAL(12,2),
    ending_cash_actual      DECIMAL(12,2),
    cash_difference         DECIMAL(12,2)
        GENERATED ALWAYS AS (ending_cash_actual - ending_cash_expected) STORED,
    status                  VARCHAR(20) DEFAULT 'OPEN'   -- OPEN | CLOSED
);
CREATE INDEX idx_sessions_branch_status ON pos_sessions(branch_id, status);

-- Tạo bảng orders (Đơn hàng)
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID REFERENCES tenants(id)      ON DELETE CASCADE,
    branch_id       UUID REFERENCES branches(id)     ON DELETE CASCADE,
    pos_session_id  UUID REFERENCES pos_sessions(id) ON DELETE RESTRICT,
    user_id         UUID REFERENCES users(id)        ON DELETE SET NULL,
    table_id        UUID REFERENCES tables(id)       ON DELETE SET NULL,
    order_number    VARCHAR(50) NOT NULL,
    source          VARCHAR(20) DEFAULT 'IN_STORE',
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    subtotal        DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount      DECIMAL(12,2) DEFAULT 0,
    total_amount    DECIMAL(12,2) DEFAULT 0,
    notes           TEXT,
    completed_at    TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      UUID REFERENCES users(id)        ON DELETE SET NULL,
    updated_at      TIMESTAMP,
    version         BIGINT DEFAULT 0,
    CONSTRAINT uq_order_number_branch UNIQUE (branch_id, order_number)
);
CREATE INDEX idx_orders_branch_status   ON orders(branch_id, status);
CREATE INDEX idx_orders_branch_date     ON orders(branch_id, created_at DESC);
CREATE INDEX idx_orders_user            ON orders(user_id);
CREATE INDEX idx_orders_session         ON orders(pos_session_id);

-- Tạo bảng order_items (Chi tiết món)
CREATE TABLE order_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
    item_id     UUID REFERENCES items(id)  ON DELETE RESTRICT,
    item_name   VARCHAR(255) NOT NULL,     
    quantity    INT          NOT NULL CHECK (quantity > 0),
    unit_price  DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    addons      JSONB,                     
    notes       VARCHAR(255),
    status      VARCHAR(20) DEFAULT 'PENDING'
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Tạo bảng order_status_logs (Lịch sử đổi trạng thái)
CREATE TABLE order_status_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID REFERENCES orders(id) ON DELETE CASCADE,
    old_status          VARCHAR(20),
    new_status          VARCHAR(20) NOT NULL,
    changed_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    reason              VARCHAR(255),
    changed_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_order_status_logs ON order_status_logs(order_id, changed_at DESC);
