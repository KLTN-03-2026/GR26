-- ============================================================
-- V17: Bổ sung base_output_quantity và base_output_unit vào bảng recipes
-- ============================================================
-- Author: HOÀNG
-- Ngày:   16/04/2026
-- Fix bug: RecordProductionBatchCommandHandler nhân recipe.quantity × expectedOutputQuantity
--          dẫn đến trừ kho sai (ví dụ: 1000g × 2000ml = 2,000,000g thay vì 1000g).
--          Cần thêm "sản lượng đầu ra chuẩn" của mỗi công thức để tính đúng hệ số scale.
-- ============================================================
--
-- Ý nghĩa nghiệp vụ:
--   - base_output_quantity: sản lượng đầu ra chuẩn mà công thức này tạo ra (VD: 2000)
--   - base_output_unit:     đơn vị của sản lượng đó (VD: ml)
--   - Chỉ áp dụng cho recipe của SUB_ASSEMBLY; recipe SELLABLE để NULL.
--
-- Khi ghi nhận mẻ sản xuất:
--   scaleFactor = expectedOutputQuantity / base_output_quantity
--   needed      = recipe.quantity × scaleFactor
-- ============================================================

ALTER TABLE recipes
    ADD COLUMN base_output_quantity NUMERIC(10, 4) NULL,
    ADD COLUMN base_output_unit     VARCHAR(30)    NULL;

COMMENT ON COLUMN recipes.base_output_quantity IS
    'Sản lượng đầu ra chuẩn của công thức này (chỉ dùng cho SUB_ASSEMBLY recipe). '
    'Dùng để tính scaleFactor khi ghi nhận mẻ sản xuất. NULL với recipe SELLABLE.';

COMMENT ON COLUMN recipes.base_output_unit IS
    'Đơn vị của base_output_quantity (VD: ml, g, cái). NULL với recipe SELLABLE.';
