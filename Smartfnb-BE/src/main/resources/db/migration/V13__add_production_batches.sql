-- ============================================================
-- V13: Bảng production_batches — Mẻ sản xuất bán thành phẩm
-- ============================================================
-- Mục đích: Ghi nhận mỗi lần sản xuất bán thành phẩm (SUB_ASSEMBLY).
-- Khi một mẻ được tạo (CONFIRMED ngay):
--   - Nguyên liệu đầu vào bị trừ theo công thức (ghi PRODUCTION_OUT vào inventory_transactions)
--   - Tồn kho bán thành phẩm tăng theo actual_output (ghi PRODUCTION_IN vào inventory_transactions)
--   - Chênh lệch expected vs actual được lưu để theo dõi hao hụt / chất lượng
-- ============================================================

CREATE TABLE production_batches (
    id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Multi-tenant scope
    tenant_id            UUID        NOT NULL,
    branch_id            UUID        NOT NULL,

    -- Bán thành phẩm được sản xuất ra
    sub_assembly_item_id UUID        NOT NULL,   -- FK items.id, type=SUB_ASSEMBLY

    -- Snapshot công thức tại thời điểm sản xuất (để audit nếu công thức thay đổi sau)
    recipe_snapshot      JSONB,

    -- Sản lượng
    expected_output      NUMERIC(10, 4) NOT NULL CHECK (expected_output >= 0),
    actual_output        NUMERIC(10, 4) NOT NULL CHECK (actual_output >= 0),
    unit                 VARCHAR(30) NOT NULL,

    -- Audit
    produced_by          UUID        NOT NULL,   -- FK staff
    produced_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    note                 TEXT,

    -- Trạng thái: CONFIRMED (duy nhất — không có DRAFT để giữ đơn giản)
    status               VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',

    created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_production_batches_status CHECK (status IN ('CONFIRMED'))
);

-- Index tìm kiếm theo branch + sub_assembly (query danh sách mẻ sản xuất)
CREATE INDEX idx_prod_batches_branch_item
    ON production_batches(branch_id, sub_assembly_item_id, produced_at DESC);

-- Index tìm kiếm theo tenant (audit toàn tenant)
CREATE INDEX idx_prod_batches_tenant
    ON production_batches(tenant_id, produced_at DESC);

-- ============================================================
-- Mở rộng type constraint của inventory_transactions
-- để hỗ trợ PRODUCTION_IN và PRODUCTION_OUT
-- ============================================================
-- Note: Giả sử V7 dùng CHECK constraint hoặc type VARCHAR — thêm 2 type mới hợp lệ
-- Nếu dùng CHECK: alter constraint; nếu dùng VARCHAR (không có check): không cần làm gì.
-- Kiểm tra và thêm comment để document type mới:
COMMENT ON COLUMN inventory_transactions.type IS
    'IMPORT | SALE_DEDUCT | WASTE | ADJUSTMENT | PRODUCTION_IN | PRODUCTION_OUT';
