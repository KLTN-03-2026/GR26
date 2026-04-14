-- ============================================================
-- V14: Relax inventory_transactions type constraint
-- ============================================================
-- Mục đích: Hỗ trợ thêm 2 loại giao dịch từ việc mẻ sản xuất (PRODUCTION_IN, PRODUCTION_OUT)
-- ============================================================

ALTER TABLE inventory_transactions DROP CONSTRAINT ck_inv_trans_type;

ALTER TABLE inventory_transactions ADD CONSTRAINT ck_inv_trans_type 
CHECK (type IN ('IMPORT', 'SALE_DEDUCT', 'WASTE', 'ADJUSTMENT', 'PRODUCTION_IN', 'PRODUCTION_OUT'));

COMMENT ON COLUMN inventory_transactions.type IS 'IMPORT | SALE_DEDUCT | WASTE | ADJUSTMENT | PRODUCTION_IN | PRODUCTION_OUT';
