-- ==============================================================================
-- V4: Module Table — Zone & Sơ đồ bàn
-- Tạo bảng table_zones, tables và các index cần thiết
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
    tenant_id   UUID REFERENCES tenants(id)     ON DELETE CASCADE,
    branch_id   UUID REFERENCES branches(id)    ON DELETE CASCADE,
    zone_id     UUID REFERENCES table_zones(id) ON DELETE SET NULL,
    name        VARCHAR(50) NOT NULL,
    capacity    INT DEFAULT 4 CHECK (capacity > 0),
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
