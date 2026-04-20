-- ==============================================================================
-- DATABASE: SmartF&B — SaaS Multi-Tenant POS & Chain Management
-- PostgreSQL 16 | Version: 2.0 FINAL
-- Covers: 13 Modules, 36 User Stories
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Hỗ trợ tìm kiếm full-text nhanh

-- ==============================================================================
-- PHẦN 1: SAAS CORE — NỀN TẢNG PLATFORM
-- ==============================================================================

-- Gói dịch vụ SaaS (Basic / Standard / Premium)
CREATE TABLE plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    slug            VARCHAR(50)  NOT NULL UNIQUE,
    price_monthly   DECIMAL(12,2) NOT NULL CHECK (price_monthly >= 0),
    max_branches    INT NOT NULL DEFAULT 1,
    features        JSONB NOT NULL DEFAULT '{}',
    -- VD: {"POS": true, "INVENTORY": true, "PROMOTION": false, "AI": false}
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chuỗi / Thương hiệu F&B (mỗi chủ quán là 1 tenant)
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id         UUID REFERENCES plans(id) ON DELETE RESTRICT,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) UNIQUE,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    tax_code        VARCHAR(50),
    logo_url        TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    -- ACTIVE | SUSPENDED | CANCELLED
    plan_expires_at TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- PHẦN 2: XÁC THỰC & NGƯỜI DÙNG
-- ==============================================================================

-- Tất cả tài khoản người dùng (Owner, Manager, Cashier, Barista, Waiter...)
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
    full_name           VARCHAR(255) NOT NULL,
    email               VARCHAR(255),
    phone               VARCHAR(20),
    password_hash       VARCHAR(255),
    pos_pin             VARCHAR(255),   -- Hashed PIN đăng nhập POS nhanh
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    -- ACTIVE | INACTIVE | LOCKED
    failed_login_count  INT DEFAULT 0,
    locked_until        TIMESTAMP,      -- Khóa tạm thời khi sai quá N lần
    last_login_at       TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email_tenant UNIQUE (tenant_id, email),
    CONSTRAINT uq_users_phone_tenant UNIQUE (tenant_id, phone)
);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- OTP cho quên mật khẩu / xác thực email
CREATE TABLE otp_records (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    otp_hash    VARCHAR(255) NOT NULL,
    purpose     VARCHAR(30)  NOT NULL,  -- RESET_PASSWORD | VERIFY_EMAIL
    expires_at  TIMESTAMP    NOT NULL,
    is_used     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_otp_user_purpose ON otp_records(user_id, purpose, is_used)
    WHERE is_used = FALSE;

-- ==============================================================================
-- PHẦN 3: CHI NHÁNH & PHÂN CÔNG NHÂN VIÊN
-- ==============================================================================

-- Chi nhánh trong chuỗi
CREATE TABLE branches (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    code                VARCHAR(50)  NOT NULL,  -- Mã định danh duy nhất
    address             TEXT,
    latitude            DECIMAL(10,7),
    longitude           DECIMAL(10,7),
    phone               VARCHAR(20),
    manager_user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    -- ACTIVE | INACTIVE | TEMPORARILY_CLOSED
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_branch_code_tenant UNIQUE (tenant_id, code)
);
CREATE INDEX idx_branches_tenant ON branches(tenant_id);

-- Nhân viên được phân công vào chi nhánh (1 NV có thể thuộc nhiều chi nhánh)
CREATE TABLE branch_users (
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES branches(id) ON DELETE CASCADE,
    is_primary_branch   BOOLEAN DEFAULT TRUE,
    assigned_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, branch_id)
);
CREATE INDEX idx_branch_users_branch ON branch_users(branch_id);

-- ==============================================================================
-- PHẦN 4: HỆ THỐNG PHÂN QUYỀN ĐỘNG (RBAC)
-- ==============================================================================

-- Danh sách quyền hạn toàn hệ thống (seed data, không thay đổi theo tenant)
CREATE TABLE permissions (
    id          VARCHAR(60) PRIMARY KEY,  -- VD: ORDER_CREATE, INVENTORY_EDIT
    module      VARCHAR(50) NOT NULL,     -- VD: POS, INVENTORY, HR, REPORT
    description VARCHAR(255)
);

-- Vai trò được định nghĩa theo từng tenant (linh hoạt đặt tên)
CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,   -- VD: "Thu Ngân Ca Khuya", "Quản Lý"
    description VARCHAR(255),
    CONSTRAINT uq_role_name_tenant UNIQUE (tenant_id, name)
);

-- Ma trận role ↔ permission
CREATE TABLE role_permissions (
    role_id         UUID    REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   VARCHAR(60) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Nhân viên được gán vai trò
CREATE TABLE user_roles (
    user_id     UUID REFERENCES users(id)  ON DELETE CASCADE,
    role_id     UUID REFERENCES roles(id)  ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Audit log thay đổi phân quyền (bắt buộc theo business rule)
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id)   ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    -- PERMISSION_CHANGED | ORDER_CANCELLED | STOCK_ADJUSTED | REFUND_PROCESSED
    target_type VARCHAR(50),   -- user | order | inventory | voucher
    target_id   UUID,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  INET,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);

-- ==============================================================================
-- PHẦN 5: THỰC ĐƠN — DANH MỤC, MÓN ĂN, TOPPING, CÔNG THỨC
-- ==============================================================================

-- Danh mục món ăn/đồ uống
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    display_order   INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_category_name_tenant UNIQUE (tenant_id, name)
);
CREATE INDEX idx_categories_tenant ON categories(tenant_id) WHERE is_active = TRUE;

-- Món ăn / Đồ uống / Nguyên liệu / Bán thành phẩm (dùng chung 1 bảng)
CREATE TABLE items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(20)  NOT NULL,
    -- SELLABLE (bán được) | INGREDIENT (nguyên liệu) | SUB_ASSEMBLY (bán thành phẩm)
    base_price      DECIMAL(12,2) DEFAULT 0 CHECK (base_price >= 0),
    unit            VARCHAR(30),    -- cái, ly, kg, g, ml, lít
    image_url       TEXT,
    is_sync_delivery BOOLEAN DEFAULT FALSE,  -- Đồng bộ lên app giao hàng
    is_active       BOOLEAN DEFAULT TRUE,
    deleted_at      TIMESTAMP,               -- Soft delete
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_item_name_tenant UNIQUE (tenant_id, name)
);
CREATE INDEX idx_items_tenant_type ON items(tenant_id, type) WHERE deleted_at IS NULL;
-- Index tìm kiếm full-text tên món (pg_trgm)
CREATE INDEX idx_items_name_trgm ON items USING gin(name gin_trgm_ops);

-- Giá bán & trạng thái theo chi nhánh (ghi đè base_price nếu cần)
CREATE TABLE branch_items (
    branch_id       UUID REFERENCES branches(id)  ON DELETE CASCADE,
    item_id         UUID REFERENCES items(id)      ON DELETE CASCADE,
    branch_price    DECIMAL(12,2),    -- NULL = dùng base_price của items
    is_available    BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (branch_id, item_id)
);

-- Topping / Add-on (có thể áp dụng cho nhiều món)
CREATE TABLE addons (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    extra_price DECIMAL(12,2) DEFAULT 0 CHECK (extra_price >= 0),
    is_active   BOOLEAN DEFAULT TRUE,
    CONSTRAINT uq_addon_name_tenant UNIQUE (tenant_id, name)
);

-- Công thức chế biến: 1 món bán = N nguyên liệu với định lượng cụ thể
CREATE TABLE recipes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
    target_item_id      UUID REFERENCES items(id)   ON DELETE CASCADE,
    ingredient_item_id  UUID REFERENCES items(id)   ON DELETE RESTRICT,
    quantity            DECIMAL(10,4) NOT NULL CHECK (quantity > 0),
    unit                VARCHAR(30),
    CONSTRAINT uq_recipe_item_ingredient UNIQUE (target_item_id, ingredient_item_id)
);
CREATE INDEX idx_recipes_target ON recipes(target_item_id);

-- ==============================================================================
-- PHẦN 6: SƠ ĐỒ BÀN
-- ==============================================================================

-- Khu vực / Tầng trong chi nhánh
CREATE TABLE table_zones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id       UUID REFERENCES branches(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,   -- VD: "Tầng 1", "Sân thượng", "VIP"
    floor_number    INT DEFAULT 1,
    CONSTRAINT uq_zone_name_branch UNIQUE (branch_id, name)
);
CREATE INDEX idx_table_zones_branch ON table_zones(branch_id);

-- Bàn trong chi nhánh
CREATE TABLE tables (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID REFERENCES tenants(id)  ON DELETE CASCADE,
    branch_id   UUID REFERENCES branches(id) ON DELETE CASCADE,
    zone_id     UUID REFERENCES table_zones(id) ON DELETE SET NULL,
    name        VARCHAR(50) NOT NULL,
    capacity    INT DEFAULT 4,
    status      VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    -- AVAILABLE | OCCUPIED | CLEANING
    position_x  DECIMAL(8,2) DEFAULT 0,   -- Tọa độ Drag & Drop
    position_y  DECIMAL(8,2) DEFAULT 0,
    shape       VARCHAR(10)  DEFAULT 'square',  -- square | round
    is_active   BOOLEAN DEFAULT TRUE,
    deleted_at  TIMESTAMP,
    CONSTRAINT uq_table_name_zone UNIQUE (branch_id, zone_id, name)
);
CREATE INDEX idx_tables_branch_status ON tables(branch_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_tables_branch_zone ON tables(branch_id, zone_id)
    WHERE deleted_at IS NULL;

-- ==============================================================================
-- PHẦN 7: CA LÀM VIỆC (SHIFT)
-- ==============================================================================

-- Template khung giờ ca (Sáng / Chiều / Tối / Ca gãy)
CREATE TABLE shift_templates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id   UUID REFERENCES branches(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,   -- VD: "Ca sáng 6h-14h"
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    min_staff   INT DEFAULT 1,
    max_staff   INT DEFAULT 10,
    color       VARCHAR(7),              -- Hex color cho UI calendar
    CONSTRAINT chk_shift_time CHECK (end_time > start_time)
);

-- Ca làm việc thực tế (mỗi người mỗi ngày)
CREATE TABLE shift_schedules (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id           UUID REFERENCES branches(id)        ON DELETE CASCADE,
    user_id             UUID REFERENCES users(id)            ON DELETE RESTRICT,
    shift_template_id   UUID REFERENCES shift_templates(id)  ON DELETE RESTRICT,
    date                DATE NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    -- SCHEDULED | COMPLETED | ABSENT | CANCELLED
    checked_in_at       TIMESTAMP,
    checked_out_at      TIMESTAMP,
    overtime_minutes    INT DEFAULT 0,
    note                VARCHAR(255),
    CONSTRAINT uq_staff_shift_date UNIQUE (user_id, shift_template_id, date)
);
CREATE INDEX idx_shift_branch_date ON shift_schedules(branch_id, date);
CREATE INDEX idx_shift_user_date ON shift_schedules(user_id, date);

-- Ca POS (phiên mở quầy - quản lý tiền mặt)
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

-- ==============================================================================
-- PHẦN 8: ĐƠN HÀNG
-- ==============================================================================

-- Đơn hàng (trung tâm của POS)
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID REFERENCES tenants(id)      ON DELETE CASCADE,
    branch_id       UUID REFERENCES branches(id)     ON DELETE CASCADE,
    pos_session_id  UUID REFERENCES pos_sessions(id) ON DELETE RESTRICT,
    user_id         UUID REFERENCES users(id)        ON DELETE SET NULL,
    table_id        UUID REFERENCES tables(id)       ON DELETE SET NULL,
    order_number    VARCHAR(50) NOT NULL,
    source          VARCHAR(20) DEFAULT 'IN_STORE',
    -- IN_STORE | TAKEAWAY | DELIVERY
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING | PROCESSING | COMPLETED | CANCELLED
    subtotal        DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount      DECIMAL(12,2) DEFAULT 0,
    total_amount    DECIMAL(12,2) DEFAULT 0,
    notes           TEXT,
    completed_at    TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_order_number_branch UNIQUE (branch_id, order_number)
);
CREATE INDEX idx_orders_branch_status   ON orders(branch_id, status);
CREATE INDEX idx_orders_branch_date     ON orders(branch_id, created_at DESC);
CREATE INDEX idx_orders_user            ON orders(user_id);
CREATE INDEX idx_orders_session         ON orders(pos_session_id);

-- Món trong đơn hàng
CREATE TABLE order_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
    item_id     UUID REFERENCES items(id)  ON DELETE RESTRICT,
    item_name   VARCHAR(255) NOT NULL,     -- Snapshot tên lúc bán (tránh sai khi item đổi tên)
    quantity    INT          NOT NULL CHECK (quantity > 0),
    unit_price  DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    addons      JSONB,                     -- [{"name":"Thêm đường","price":3000}]
    notes       VARCHAR(255),
    status      VARCHAR(20) DEFAULT 'PENDING'
    -- PENDING | PROCESSING | READY | SERVED | CANCELLED
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Lịch sử thay đổi trạng thái đơn (bắt buộc theo business rule)
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

-- ==============================================================================
-- PHẦN 9: THANH TOÁN & HÓA ĐƠN
-- ==============================================================================

-- Giao dịch thanh toán
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
    order_id        UUID REFERENCES orders(id)  ON DELETE RESTRICT,
    amount          DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    method          VARCHAR(20)   NOT NULL,
    -- CASH | VIETQR | MOMO | ZALOPAY
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    -- PENDING | COMPLETED | FAILED | REFUNDED
    transaction_id  VARCHAR(255),   -- ID trả về từ payment gateway
    cashier_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    qr_expires_at   TIMESTAMP,      -- Hết hạn QR sau 3 phút
    paid_at         TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_payments_order    ON payments(order_id);
CREATE INDEX idx_payments_tenant   ON payments(tenant_id, created_at DESC);

-- Hóa đơn (immutable sau khi tạo — chỉ refund, không sửa)
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID REFERENCES tenants(id)  ON DELETE CASCADE,
    branch_id       UUID REFERENCES branches(id) ON DELETE RESTRICT,
    order_id        UUID REFERENCES orders(id)   ON DELETE RESTRICT,
    payment_id      UUID REFERENCES payments(id) ON DELETE RESTRICT,
    invoice_number  VARCHAR(50) UNIQUE NOT NULL,   -- Bất biến
    subtotal        DECIMAL(12,2) NOT NULL,
    discount        DECIMAL(12,2) DEFAULT 0,
    tax_amount      DECIMAL(12,2) DEFAULT 0,
    total           DECIMAL(12,2) NOT NULL,
    issued_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_invoices_branch_date   ON invoices(branch_id, issued_at DESC);
CREATE INDEX idx_invoices_tenant_date   ON invoices(tenant_id, issued_at DESC);

-- Chi tiết hóa đơn (snapshot tại thời điểm bán)
CREATE TABLE invoice_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id  UUID REFERENCES invoices(id) ON DELETE CASCADE,
    item_name   VARCHAR(255)  NOT NULL,
    quantity    INT           NOT NULL,
    unit_price  DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL
);

-- ==============================================================================
-- PHẦN 10: KHUYẾN MÃI & VOUCHER
-- ==============================================================================

-- Chương trình khuyến mãi
CREATE TABLE promotions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    type                VARCHAR(20)  NOT NULL,
    -- PERCENT | FIXED_AMOUNT | BUY_X_GET_Y
    value               DECIMAL(10,2) NOT NULL CHECK (value >= 0),
    min_order_value     DECIMAL(12,2) DEFAULT 0,
    max_discount        DECIMAL(12,2),           -- Giới hạn tối đa giảm
    applicable_branches JSONB,                   -- NULL = áp dụng tất cả chi nhánh
    start_date          TIMESTAMP,
    end_date            TIMESTAMP,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_promo_dates CHECK (end_date IS NULL OR end_date > start_date)
);
CREATE INDEX idx_promotions_tenant_active ON promotions(tenant_id, is_active, end_date);

-- Mã voucher cụ thể cho từng chương trình
CREATE TABLE vouchers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id    UUID REFERENCES promotions(id) ON DELETE CASCADE,
    code            VARCHAR(50) UNIQUE NOT NULL,
    max_uses        INT DEFAULT 1 CHECK (max_uses > 0),
    used_count      INT DEFAULT 0,
    expires_at      TIMESTAMP,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_voucher_used CHECK (used_count <= max_uses)
);
CREATE INDEX idx_vouchers_code ON vouchers(code) WHERE is_active = TRUE;

-- Lịch sử sử dụng voucher (chống dùng lại)
CREATE TABLE voucher_usages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id          UUID REFERENCES vouchers(id) ON DELETE RESTRICT,
    order_id            UUID REFERENCES orders(id)   ON DELETE RESTRICT,
    used_by_user_id     UUID REFERENCES users(id)    ON DELETE SET NULL,
    discount_applied    DECIMAL(12,2) NOT NULL,
    used_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_voucher_order UNIQUE (voucher_id, order_id)
);

-- ==============================================================================
-- PHẦN 11: KHO NGUYÊN LIỆU (INVENTORY)
-- ==============================================================================

-- Tồn kho hiện tại theo chi nhánh (1 dòng = 1 nguyên liệu tại 1 chi nhánh)
CREATE TABLE inventory_balances (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID REFERENCES tenants(id)  ON DELETE CASCADE,
    branch_id   UUID REFERENCES branches(id) ON DELETE CASCADE,
    item_id     UUID REFERENCES items(id)    ON DELETE RESTRICT,
    quantity    DECIMAL(10,4) DEFAULT 0 CHECK (quantity >= 0),
    min_level   DECIMAL(10,4) DEFAULT 0,     -- Ngưỡng cảnh báo sắp hết
    version     INT DEFAULT 0,               -- Optimistic locking
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_inventory_branch_item UNIQUE (branch_id, item_id)
);
CREATE INDEX idx_inventory_branch ON inventory_balances(branch_id);
CREATE INDEX idx_inventory_low_stock ON inventory_balances(branch_id, item_id)
    WHERE quantity <= min_level;             -- Partial index cảnh báo sắp hết

-- Lô hàng nhập kho (hỗ trợ xuất kho FIFO + theo dõi hạn sử dụng)
CREATE TABLE stock_batches (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID REFERENCES tenants(id)   ON DELETE CASCADE,
    branch_id           UUID REFERENCES branches(id)  ON DELETE CASCADE,
    item_id             UUID REFERENCES items(id)      ON DELETE RESTRICT,
    supplier_id         UUID,                  -- FK tới suppliers (tạo sau)
    quantity_initial    DECIMAL(10,4) NOT NULL CHECK (quantity_initial > 0),
    quantity_remaining  DECIMAL(10,4) NOT NULL CHECK (quantity_remaining >= 0),
    cost_per_unit       DECIMAL(12,4) NOT NULL CHECK (cost_per_unit >= 0),
    imported_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at          TIMESTAMP,             -- Cảnh báo hết hạn (Báo cáo Kho)
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Index FIFO: ưu tiên lô nhập sớm nhất còn hàng
CREATE INDEX idx_batches_fifo ON stock_batches(branch_id, item_id, imported_at ASC)
    WHERE quantity_remaining > 0;
-- Index cảnh báo hết hạn
CREATE INDEX idx_batches_expiry ON stock_batches(branch_id, expires_at ASC)
    WHERE quantity_remaining > 0 AND expires_at IS NOT NULL;

-- Lịch sử mọi biến động kho (nhập / xuất / trừ bán / hao hụt / điều chỉnh)
CREATE TABLE inventory_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID REFERENCES tenants(id)  ON DELETE CASCADE,
    branch_id       UUID REFERENCES branches(id) ON DELETE CASCADE,
    item_id         UUID REFERENCES items(id)    ON DELETE RESTRICT,
    user_id         UUID REFERENCES users(id)    ON DELETE SET NULL,
    batch_id        UUID REFERENCES stock_batches(id) ON DELETE SET NULL,
    type            VARCHAR(20) NOT NULL,
    -- IMPORT | EXPORT | SALE_DEDUCT | WASTE | ADJUSTMENT
    quantity        DECIMAL(10,4) NOT NULL,     -- Dương = nhập, Âm = xuất
    cost_per_unit   DECIMAL(12,4),
    reference_id    UUID,                       -- order_id hoặc purchase_order_id
    reference_type  VARCHAR(30),                -- ORDER | PURCHASE_ORDER | MANUAL
    note            VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_inv_trans_branch_item  ON inventory_transactions(branch_id, item_id, created_at DESC);
CREATE INDEX idx_inv_trans_type         ON inventory_transactions(branch_id, type, created_at DESC);

-- ==============================================================================
-- PHẦN 12: NHÀ CUNG CẤP
-- ==============================================================================

CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    contact_person  VARCHAR(255),
    phone           VARCHAR(20),
    email           VARCHAR(255),
    address         TEXT,
    tax_code        VARCHAR(50),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id) WHERE is_active = TRUE;

-- Thêm FK supplier vào stock_batches sau khi bảng suppliers đã tồn tại
ALTER TABLE stock_batches
    ADD CONSTRAINT fk_batches_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Đơn đặt hàng nhà cung cấp
CREATE TABLE purchase_orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID REFERENCES tenants(id)   ON DELETE CASCADE,
    branch_id           UUID REFERENCES branches(id)  ON DELETE CASCADE,
    supplier_id         UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    created_by_user_id  UUID REFERENCES users(id)     ON DELETE SET NULL,
    po_number           VARCHAR(50) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    -- DRAFT | SENT | RECEIVED | CANCELLED
    total_amount        DECIMAL(12,2) DEFAULT 0,
    ordered_at          TIMESTAMP,
    received_at         TIMESTAMP,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_po_number_tenant UNIQUE (tenant_id, po_number)
);
CREATE INDEX idx_po_branch_status ON purchase_orders(branch_id, status, created_at DESC);

-- Dòng hàng trong đơn đặt mua
CREATE TABLE purchase_order_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id   UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id             UUID REFERENCES items(id)           ON DELETE RESTRICT,
    quantity            DECIMAL(10,4) NOT NULL CHECK (quantity > 0),
    unit_cost           DECIMAL(12,4) NOT NULL CHECK (unit_cost >= 0),
    total_cost          DECIMAL(12,2)
        GENERATED ALWAYS AS (quantity * unit_cost) STORED
);

-- ==============================================================================
-- PHẦN 13: BÁO CÁO — PRE-AGGREGATED TABLES
-- (Được cập nhật qua scheduled job hoặc domain event — tránh query nặng)
-- ==============================================================================

-- Tổng hợp doanh thu theo ngày / chi nhánh
CREATE TABLE daily_revenue_summaries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID REFERENCES tenants(id)  ON DELETE CASCADE,
    branch_id           UUID REFERENCES branches(id) ON DELETE CASCADE,
    date                DATE NOT NULL,
    total_revenue       DECIMAL(12,2) DEFAULT 0,
    total_orders        INT DEFAULT 0,
    avg_order_value     DECIMAL(12,2) DEFAULT 0,
    payment_breakdown   JSONB DEFAULT '{}',
    -- {"CASH": 500000, "MOMO": 200000, "VIETQR": 300000}
    cost_of_goods       DECIMAL(12,2) DEFAULT 0,
    gross_profit        DECIMAL(12,2)
        GENERATED ALWAYS AS (total_revenue - cost_of_goods) STORED,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_daily_rev_branch_date UNIQUE (branch_id, date)
);
CREATE INDEX idx_daily_rev_branch_date ON daily_revenue_summaries(branch_id, date DESC);
CREATE INDEX idx_daily_rev_tenant_date ON daily_revenue_summaries(tenant_id, date DESC);

-- Thống kê doanh thu theo giờ (heatmap)
CREATE TABLE hourly_revenue_stats (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id       UUID REFERENCES branches(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    hour            SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 23),
    order_count     INT DEFAULT 0,
    revenue         DECIMAL(12,2) DEFAULT 0,
    CONSTRAINT uq_hourly_branch_date_hour UNIQUE (branch_id, date, hour)
);
CREATE INDEX idx_hourly_branch_date ON hourly_revenue_stats(branch_id, date DESC);

-- Hiệu suất từng món theo ngày (top seller, slow mover)
CREATE TABLE daily_item_stats (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID REFERENCES tenants(id)  ON DELETE CASCADE,
    branch_id   UUID REFERENCES branches(id) ON DELETE CASCADE,
    item_id     UUID REFERENCES items(id)    ON DELETE CASCADE,
    date        DATE NOT NULL,
    qty_sold    INT DEFAULT 0,
    revenue     DECIMAL(12,2) DEFAULT 0,
    cost        DECIMAL(12,2) DEFAULT 0,
    gross_margin DECIMAL(5,2)
        GENERATED ALWAYS AS (
            CASE WHEN revenue > 0 THEN (revenue - cost) / revenue * 100 ELSE 0 END
        ) STORED,
    CONSTRAINT uq_item_stat_branch_date UNIQUE (branch_id, item_id, date)
);
CREATE INDEX idx_item_stats_branch_date ON daily_item_stats(branch_id, date DESC);

-- ==============================================================================
-- PHẦN 14: AI INSIGHTS
-- ==============================================================================

CREATE TABLE ai_insights (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID REFERENCES tenants(id)  ON DELETE CASCADE,
    branch_id       UUID REFERENCES branches(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    -- LOW_STOCK_FORECAST | DEMAND_PREDICTION | WASTE_ANOMALY | PURCHASE_SUGGESTION
    insight_text    TEXT NOT NULL,
    data            JSONB,           -- Dữ liệu số liệu đính kèm để FE render biểu đồ
    is_acknowledged BOOLEAN DEFAULT FALSE,
    expires_at      TIMESTAMP,       -- Insight hết hạn sau N ngày
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_insights_tenant_ack ON ai_insights(tenant_id, is_acknowledged, created_at DESC);

-- ==============================================================================
-- SEED DATA: PERMISSIONS (Bất biến — định nghĩa tất cả quyền trong hệ thống)
-- ==============================================================================

INSERT INTO permissions (id, module, description) VALUES
-- POS & Order
('ORDER_VIEW',          'POS',          'Xem danh sách đơn hàng'),
('ORDER_CREATE',        'POS',          'Tạo đơn hàng mới'),
('ORDER_UPDATE',        'POS',          'Cập nhật trạng thái đơn hàng'),
('ORDER_CANCEL',        'POS',          'Hủy đơn hàng'),
-- Payment
('PAYMENT_CREATE',      'PAYMENT',      'Thực hiện thanh toán'),
('PAYMENT_REFUND',      'PAYMENT',      'Hoàn tiền'),
('INVOICE_VIEW',        'PAYMENT',      'Xem hóa đơn'),
('INVOICE_PRINT',       'PAYMENT',      'In / gửi lại hóa đơn'),
-- Menu
('MENU_VIEW',           'MENU',         'Xem thực đơn'),
('MENU_EDIT',           'MENU',         'Thêm / sửa / vô hiệu hóa món'),
-- Inventory
('INVENTORY_VIEW',      'INVENTORY',    'Xem tồn kho'),
('INVENTORY_IMPORT',    'INVENTORY',    'Nhập kho'),
('INVENTORY_ADJUST',    'INVENTORY',    'Điều chỉnh kho thủ công'),
('INVENTORY_WASTE',     'INVENTORY',    'Ghi nhận hao hụt'),
-- Staff & Shift
('STAFF_VIEW',          'HR',           'Xem danh sách nhân viên'),
('STAFF_EDIT',          'HR',           'Thêm / sửa / khóa nhân viên'),
('SHIFT_VIEW',          'HR',           'Xem lịch ca'),
('SHIFT_REGISTER',      'HR',           'Đăng ký ca làm việc'),
('SHIFT_MANAGE',        'HR',           'Quản lý ca (tạo / phân công)'),
-- Promotion
('PROMOTION_VIEW',      'PROMOTION',    'Xem khuyến mãi và voucher'),
('PROMOTION_EDIT',      'PROMOTION',    'Tạo / sửa chương trình khuyến mãi'),
('VOUCHER_APPLY',       'PROMOTION',    'Áp dụng voucher vào đơn hàng'),
-- Supplier
('SUPPLIER_VIEW',       'SUPPLIER',     'Xem nhà cung cấp'),
('SUPPLIER_EDIT',       'SUPPLIER',     'Thêm / sửa nhà cung cấp'),
('PURCHASE_ORDER_EDIT', 'SUPPLIER',     'Tạo / duyệt đơn đặt hàng'),
-- Report
('REPORT_REVENUE',      'REPORT',       'Xem báo cáo doanh thu'),
('REPORT_INVENTORY',    'REPORT',       'Xem báo cáo kho'),
('REPORT_HR',           'REPORT',       'Xem báo cáo nhân sự'),
('REPORT_EXPORT',       'REPORT',       'Xuất báo cáo Excel / PDF'),
-- Branch & System
('BRANCH_EDIT',         'SYSTEM',       'Thêm / sửa chi nhánh'),
('PERMISSION_EDIT',     'SYSTEM',       'Thay đổi phân quyền vai trò');
