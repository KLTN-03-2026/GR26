-- ==============================================================================
-- V16: Liên kết Addon → Inventory Item
--
-- Thêm 3 cột vào bảng addons để addon có thể tiêu hao nguyên liệu kho:
--
--   item_id       → FK tới items(id), type = INGREDIENT hoặc SUB_ASSEMBLY
--   item_quantity → Định lượng cần dùng cho mỗi 1 đơn vị addon bán ra
--   item_unit     → Đơn vị tính (g, ml, cái...) — gợi ý, không bắt buộc
--
-- Quy tắc nghiệp vụ:
--   item_id = NULL   → addon thuần giá (không trừ kho)
--   item_id NOT NULL → deductFifo(item_id, item_quantity × addonQty × orderQty)
--
-- Cả INGREDIENT (trực tiếp) và SUB_ASSEMBLY (có tồn kho từ production batch)
-- đều đi qua cùng 1 đường deduction — consistent với cách recipe của SELLABLE items hoạt động.
-- ==============================================================================

ALTER TABLE addons
    ADD COLUMN item_id       UUID          REFERENCES items(id) ON DELETE SET NULL,
    ADD COLUMN item_quantity DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    ADD COLUMN item_unit     VARCHAR(30);

COMMENT ON COLUMN addons.item_id IS
    'FK toi items: INGREDIENT (nguyen lieu truc tiep) hoac SUB_ASSEMBLY (co ton kho tu production batch). NULL = addon thuan gia, khong tru kho.';

COMMENT ON COLUMN addons.item_quantity IS
    'Dinh luong can dung cho moi 1 don vi addon ban ra. Vi du: 30 (ml sua), 50 (g kem).';

COMMENT ON COLUMN addons.item_unit IS
    'Don vi tinh cua item_quantity. Vi du: g, ml, cai. Goi y hien thi, khong bat buoc.';

-- Sparse index — chỉ index những addon đã link item (phần lớn NULL ban đầu)
CREATE INDEX idx_addons_item_id ON addons(item_id) WHERE item_id IS NOT NULL;
