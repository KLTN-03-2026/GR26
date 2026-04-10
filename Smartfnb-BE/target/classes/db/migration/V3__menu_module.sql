-- ==============================================================================
-- V3: Module Menu — Tạo cấu trúc bảng thực đơn và Index pg_trgm
-- ==============================================================================

-- Đảm bảo pg_trgm extension đã được bật
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

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

-- Index hỗ trợ lọc category + tenant
CREATE INDEX idx_categories_tenant_active 
    ON categories(tenant_id, is_active) WHERE is_active = TRUE;

-- GIN index cho tìm kiếm tên Category theo pg_trgm
CREATE INDEX idx_categories_name_trgm 
    ON categories USING gin(name gin_trgm_ops);

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

-- GIN index cho tìm kiếm tên Item
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

-- GIN index cho tìm kiếm tên Addon
CREATE INDEX idx_addons_name_trgm ON addons USING gin(name gin_trgm_ops);

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

-- Index hỗ trợ recipe lookup theo target item
CREATE INDEX idx_recipes_target_ingredient ON recipes(target_item_id, ingredient_item_id);
