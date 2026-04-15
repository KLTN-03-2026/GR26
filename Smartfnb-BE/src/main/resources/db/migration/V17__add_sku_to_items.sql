-- ============================================================
-- V17: Add sku column to items table
-- ============================================================

ALTER TABLE items ADD COLUMN sku VARCHAR(50);

-- SKU should be unique within a tenant
CREATE UNIQUE INDEX idx_items_tenant_sku ON items (tenant_id, sku) WHERE sku IS NOT NULL;
