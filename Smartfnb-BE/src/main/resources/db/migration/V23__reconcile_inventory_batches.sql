-- V18__reconcile_inventory_batches.sql
-- Description: Clean up outdated legacy batches from 2025 causing desynchronization
--              Convert missing batch_id SALE_DEDUCT actions to ADJUSTMENTs.
--              Add a strong DB-level constraint to prevent future recurrences.

-- 1. Chuyển đổi các SALE_DEDUCT bị lỗi null batch_id (thường từ data seed hoặc luồng cũ) sang dạng ADJUSTMENT
-- để không làm sai lệch ý nghĩa báo cáo bán hàng/tồn kho batch
UPDATE inventory_transactions
SET type = 'ADJUSTMENT',
    note = COALESCE(note, '') || ' [Migrated legacy SALE_DEDUCT missing batch]'
WHERE type = 'SALE_DEDUCT' 
  AND batch_id IS NULL;

-- 2. Bổ sung cột audit cho stock_batches trước khi reconcile.
-- V7 chỉ tạo created_at, nhưng block bên dưới cần cập nhật updated_at cho các batch thay đổi.
ALTER TABLE stock_batches
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3. Thực hiện đối chiếu (Reconciliation) giữa inventory_balances và stock_batches
-- Do những dòng SALE_DEDUCT cũ bị lỗi không trừ batch, tổng số lượng trong batch đang vượt quá tồn kho thực tế,
-- dẫn đến các batch cũ (như năm 2025) bị "kẹt" lại với số lượng > 0 trên hệ thống.
-- Block PL/pgSQL này phân bổ lại tồn kho thật (inventory_balances) cho các stock_batches theo LIFO phân bổ:
-- (giữ số lượng tồn kho gán vào các lô hàng NHẬP MỚI NHẤT, lô CŨ NHẤT khi hết quota sẽ tự động về 0 - mô phỏng hoàn hảo FIFO deduct).
DO $$
DECLARE
    rec_balance RECORD;
    rec_batch RECORD;
    v_balance_remaining NUMERIC;
    v_batch_consume NUMERIC;
BEGIN
    FOR rec_balance IN 
        SELECT branch_id, item_id, quantity 
        FROM inventory_balances 
        WHERE quantity >= 0
    LOOP
        v_balance_remaining := rec_balance.quantity;
        
        -- Duyệt từ lô MỚI NHẤT đến CŨ NHẤT để assign tồn kho (tương đương lô CŨ đã bị trừ trước - FIFO)
        FOR rec_batch IN 
            SELECT id, quantity_initial, quantity_remaining 
            FROM stock_batches 
            WHERE branch_id = rec_balance.branch_id AND item_id = rec_balance.item_id 
            ORDER BY imported_at DESC, id DESC
        LOOP
            IF v_balance_remaining > 0 THEN
                IF v_balance_remaining >= rec_batch.quantity_initial THEN
                    v_batch_consume := rec_batch.quantity_initial;
                ELSE
                    v_batch_consume := v_balance_remaining;
                END IF;
                v_balance_remaining := v_balance_remaining - v_batch_consume;
                
                -- Chỉ update nếu thực sự thay đổi để tối ưu performance
                IF rec_batch.quantity_remaining IS DISTINCT FROM v_batch_consume THEN
                    UPDATE stock_batches SET quantity_remaining = v_batch_consume, updated_at = CURRENT_TIMESTAMP WHERE id = rec_batch.id;
                END IF;
            ELSE
                IF rec_batch.quantity_remaining > 0 THEN
                    UPDATE stock_batches SET quantity_remaining = 0, updated_at = CURRENT_TIMESTAMP WHERE id = rec_batch.id;
                END IF;
            END IF;
        END LOOP;
        
    END LOOP;
END;
$$;

-- 4. Thêm check constraint để từ chối bất kỳ insert/update trôi nổi nào vi phạm
ALTER TABLE inventory_transactions
ADD CONSTRAINT ck_sale_deduct_batch
CHECK (type != 'SALE_DEDUCT' OR batch_id IS NOT NULL);
