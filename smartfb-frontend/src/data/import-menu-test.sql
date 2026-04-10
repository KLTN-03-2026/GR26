-- ==============================================================================
-- Script import dữ liệu mẫu cho Module Menu
-- Tenant: 36246c27-51d6-4e76-9ec1-ca40491661fa
-- Role: OWNER
-- ==============================================================================

-- ==============================================================================
-- 1. IMPORT DANH MỤC (categories)
-- ==============================================================================

INSERT INTO categories (id, tenant_id, name, description, display_order, is_active)
VALUES
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Cà Phê', 'Các loại cà phê truyền thống và hiện đại', 1, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Trà Trái Cây', 'Trà trái cây tươi mát giải nhiệt', 2, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Trà Sữa', 'Trà sữa truyền thống và hiện đại', 3, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Sinh Tố', 'Sinh tố trái cây tươi nguyên chất', 4, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Nước Ép', 'Nước ép trái cây tươi', 5, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Bánh Ngọt', 'Bánh ngọt Âu Á các loại', 6, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Đá Xay', 'Các món đá xay lạnh', 7, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Sữa Tươi', 'Sữa tươi và các biến thể', 8, true)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- ==============================================================================
-- 2. IMPORT MÓN ĂN (items)
-- ==============================================================================

WITH category_lookup AS (
    SELECT id, name FROM categories
    WHERE tenant_id = '36246c27-51d6-4e76-9ec1-ca40491661fa'
)
INSERT INTO items (id, tenant_id, category_id, name, type, base_price, unit, is_sync_delivery, is_active)
SELECT
    gen_random_uuid(),
    '36246c27-51d6-4e76-9ec1-ca40491661fa',
    c.id,
    i.name,
    'SELLABLE',
    i.price,
    i.unit,
    i.is_sync_delivery,
    true
FROM (
    VALUES
        ('Cà Phê Đen Đá', 'Cà Phê', 25000, 'ly', true),
        ('Cà Phê Sữa Đá', 'Cà Phê', 29000, 'ly', true),
        ('Bạc Xỉu Đá', 'Cà Phê', 32000, 'ly', true),
        ('Latte Nóng', 'Cà Phê', 45000, 'ly', true),
        ('Cappuccino Nóng', 'Cà Phê', 49000, 'ly', true),
        ('Americano Đá', 'Cà Phê', 35000, 'ly', true),
        ('Espresso Tonic', 'Cà Phê', 49000, 'ly', true),
        ('Caramel Macchiato', 'Cà Phê', 55000, 'ly', true),
        ('Mocha Đá', 'Cà Phê', 52000, 'ly', true),
        ('Cold Brew', 'Cà Phê', 55000, 'ly', true),
        ('Trà Đào Cam Sả', 'Trà Trái Cây', 45000, 'ly', true),
        ('Trà Vải Hạt Chia', 'Trà Trái Cây', 48000, 'ly', true),
        ('Trà Chanh Sả Tắc', 'Trà Trái Cây', 35000, 'ly', true),
        ('Trà Ổi Hồng Sả Tắc', 'Trà Trái Cây', 42000, 'ly', true),
        ('Trà Dâu Tây Sả', 'Trà Trái Cây', 52000, 'ly', true),
        ('Trà Sữa Truyền Thống', 'Trà Sữa', 39000, 'ly', true),
        ('Trà Sữa Trân Châu Đường Đen', 'Trà Sữa', 49000, 'ly', true),
        ('Trà Sữa Oolong', 'Trà Sữa', 45000, 'ly', true),
        ('Trà Sữa Thái Xanh', 'Trà Sữa', 42000, 'ly', true),
        ('Trà Sữa Khoai Môn', 'Trà Sữa', 45000, 'ly', true),
        ('Sinh Tố Bơ', 'Sinh Tố', 45000, 'ly', true),
        ('Sinh Tố Xoài', 'Sinh Tố', 42000, 'ly', true),
        ('Sinh Tố Dâu', 'Sinh Tố', 48000, 'ly', true),
        ('Sinh Tố Sầu Riêng', 'Sinh Tố', 55000, 'ly', true),
        ('Sinh Tố Thanh Long', 'Sinh Tố', 40000, 'ly', true),
        ('Nước Ép Cam', 'Nước Ép', 38000, 'ly', true),
        ('Nước Ép Táo', 'Nước Ép', 45000, 'ly', true),
        ('Nước Ép Dưa Hấu', 'Nước Ép', 35000, 'ly', true),
        ('Nước Ép Cà Rốt', 'Nước Ép', 35000, 'ly', true),
        ('Nước Ép Cần Tây', 'Nước Ép', 42000, 'ly', true),
        ('Croissant Bơ', 'Bánh Ngọt', 42000, 'cái', true),
        ('Tiramisu', 'Bánh Ngọt', 65000, 'phần', true),
        ('Cheesecake Dâu', 'Bánh Ngọt', 58000, 'phần', true),
        ('Bánh Mì Que Tỏi', 'Bánh Ngọt', 25000, 'cái', true),
        ('Muffin Việt Quất', 'Bánh Ngọt', 38000, 'cái', true),
        ('Caramel Frappuccino', 'Đá Xay', 59000, 'ly', true),
        ('Chocolate Frappuccino', 'Đá Xay', 59000, 'ly', true),
        ('Trà Xanh Frappuccino', 'Đá Xay', 59000, 'ly', true),
        ('Dâu Tây Frappuccino', 'Đá Xay', 62000, 'ly', true),
        ('Sữa Tươi Trân Châu Đường Đen', 'Sữa Tươi', 45000, 'ly', true),
        ('Sữa Tươi Nghệ Mật Ong', 'Sữa Tươi', 42000, 'ly', true),
        ('Sữa Tươi Matcha', 'Sữa Tươi', 48000, 'ly', true),
        ('Sữa Tươi Chocolate', 'Sữa Tươi', 45000, 'ly', true),
        ('Sữa Chua Hy Lạp Trái Cây', 'Sữa Tươi', 52000, 'phần', true)
) AS i(name, category_name, price, unit, is_sync_delivery)
JOIN category_lookup c ON c.name = i.category_name
ON CONFLICT (tenant_id, name) DO NOTHING;

-- ==============================================================================
-- 3. IMPORT ADDONS/TOPPINGS
-- ==============================================================================

INSERT INTO addons (id, tenant_id, name, extra_price, is_active)
VALUES
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Trân Châu Trắng', 5000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Trân Châu Đen', 5000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Trân Châu Đường Đen', 7000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Thạch Dừa', 7000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Thạch Cà Phê', 7000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Thạch Trái Cây', 7000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Pudding Trứng', 7000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Whipping Cream', 10000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Kem Tươi', 10000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Topping Phô Mai', 10000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Bột Ca Cao', 5000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Bột Matcha', 7000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Siro Caramel', 5000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Siro Chocolate', 5000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Siro Dâu', 5000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Hạt Chia', 5000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Hạt Dẻ', 7000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Bánh Cookie', 10000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Sầu Riêng', 15000, true),
    (gen_random_uuid(), '36246c27-51d6-4e76-9ec1-ca40491661fa', 'Bơ Tươi', 15000, true)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- ==============================================================================
-- 4. ÁP DỤNG MÓN CHO TẤT CẢ CHI NHÁNH CỦA TENANT
-- ==============================================================================

INSERT INTO branch_items (branch_id, item_id, branch_price, is_available)
SELECT
    b.id,
    i.id,
    NULL,  -- NULL = dùng base_price từ items
    true
FROM items i
CROSS JOIN branches b
WHERE i.tenant_id = '36246c27-51d6-4e76-9ec1-ca40491661fa'
  AND b.tenant_id = '36246c27-51d6-4e76-9ec1-ca40491661fa'
  AND NOT EXISTS (
    SELECT 1 FROM branch_items bi
    WHERE bi.branch_id = b.id AND bi.item_id = i.id
  );

-- ==============================================================================
-- XÁC NHẬN KẾT QUẢ
-- ==============================================================================

SELECT
    'categories' as table_name,
    COUNT(*) as record_count
FROM categories
WHERE tenant_id = '36246c27-51d6-4e76-9ec1-ca40491661fa'
UNION ALL
SELECT
    'items' as table_name,
    COUNT(*) as record_count
FROM items
WHERE tenant_id = '36246c27-51d6-4e76-9ec1-ca40491661fa'
UNION ALL
SELECT
    'addons' as table_name,
    COUNT(*) as record_count
FROM addons
WHERE tenant_id = '36246c27-51d6-4e76-9ec1-ca40491661fa'
UNION ALL
SELECT
    'branch_items' as table_name,
    COUNT(*) as record_count
FROM branch_items bi
JOIN items i ON bi.item_id = i.id
WHERE i.tenant_id = '36246c27-51d6-4e76-9ec1-ca40491661fa';
