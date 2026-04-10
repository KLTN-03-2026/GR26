\set ON_ERROR_STOP on

-- Import danh sách món mẫu vào tenant Coffee House 2.
-- Gắn món cho chi nhánh Coffee House 2 qua bảng branch_items.
-- Script idempotent ở mức tên món và branch-item trong cùng tenant.

BEGIN;

WITH target_tenant AS (
  SELECT '2f2ab67e-b472-413f-934f-a10da110ec32'::uuid AS tenant_id
)
INSERT INTO categories (tenant_id, name, description, display_order, is_active)
SELECT
  target_tenant.tenant_id,
  payload.name,
  payload.description,
  payload.display_order,
  TRUE
FROM target_tenant
JOIN (
  VALUES
    ('Trà sữa', 'Danh mục trà sữa và sữa tươi trân châu', 4),
    ('Đá xay', 'Danh mục đá xay và thức uống blended', 5)
) AS payload(name, description, display_order) ON TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM categories c
  WHERE c.tenant_id = target_tenant.tenant_id
    AND lower(c.name) = lower(payload.name)
);

WITH target_tenant AS (
  SELECT '2f2ab67e-b472-413f-934f-a10da110ec32'::uuid AS tenant_id
),
category_mapping AS (
  SELECT * FROM (
    VALUES
      ('c001', 'Cà phê máy'),
      ('m002', 'Trà sữa'),
      ('t003', 'Trà trái cây'),
      ('f004', 'Đá xay'),
      ('j005', 'Nước ép')
  ) AS mapping(payload_category_id, category_name)
),
item_payload AS (
  SELECT * FROM (
    VALUES
      ('c001', 'Cà Phê Sữa Đá', 29000::numeric, 'Ly', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=1000&auto=format&fit=crop', TRUE),
      ('c001', 'Bạc Xỉu', 32000::numeric, 'Ly', 'https://images.unsplash.com/photo-1461023233037-340798282361?q=80&w=1000&auto=format&fit=crop', TRUE),
      ('c001', 'Cà Phê Muối', 35000::numeric, 'Ly', 'https://images.unsplash.com/photo-1572286258217-40142c1c6a70?q=80&w=1000&auto=format&fit=crop', FALSE),
      ('c001', 'Cà Phê Trứng', 45000::numeric, 'Ly', 'https://images.unsplash.com/photo-1594631252845-29fc4586c567?q=80&w=1000&auto=format&fit=crop', FALSE),
      ('m002', 'Trà Sữa Trân Châu Đường Đen', 45000::numeric, 'Ly', 'https://images.pexels.com/photos/5946950/pexels-photo-5946950.jpeg?auto=compress&cs=tinysrgb&w=1000', TRUE),
      ('m002', 'Trà Sữa Matcha', 39000::numeric, 'Ly', 'https://images.pexels.com/photos/5947019/pexels-photo-5947019.jpeg?auto=compress&cs=tinysrgb&w=1000', TRUE),
      ('m002', 'Trà Sữa Khoai Môn', 39000::numeric, 'Ly', 'https://images.pexels.com/photos/7311756/pexels-photo-7311756.jpeg?auto=compress&cs=tinysrgb&w=1000', TRUE),
      ('m002', 'Trà Sữa Ô Long', 35000::numeric, 'Ly', 'https://images.pexels.com/photos/849645/pexels-photo-849645.jpeg?auto=compress&cs=tinysrgb&w=1000', TRUE),
      ('t003', 'Trà Đào Cam Sả', 42000::numeric, 'Ly', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=1000&auto=format&fit=crop', TRUE),
      ('t003', 'Trà Vải Khiếm Thân', 39000::numeric, 'Ly', 'https://images.unsplash.com/photo-1597318181409-cf44d05b5af8?q=80&w=1000&auto=format&fit=crop', TRUE),
      ('t003', 'Trà Dâu Tây Đông Du', 45000::numeric, 'Ly', 'https://images.pexels.com/photos/20131461/pexels-photo-20131461.jpeg?auto=compress&cs=tinysrgb&w=1000', TRUE),
      ('t003', 'Trà Mãng Cầu', 35000::numeric, 'Ly', 'https://images.pexels.com/photos/10836561/pexels-photo-10836561.jpeg?auto=compress&cs=tinysrgb&w=1000', TRUE),
      ('f004', 'Matcha Đá Xay', 49000::numeric, 'Ly', 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?q=80&w=1000&auto=format&fit=crop', FALSE),
      ('f004', 'Cookie Đá Xay', 55000::numeric, 'Ly', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=1000&auto=format&fit=crop', FALSE),
      ('f004', 'Sô-cô-la Đá Xay', 52000::numeric, 'Ly', 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?q=80&w=1000&auto=format&fit=crop', FALSE),
      ('j005', 'Nước Ép Cam Tươi', 35000::numeric, 'Ly', 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=1000&auto=format&fit=crop', TRUE),
      ('j005', 'Nước Ép Dưa Hấu', 32000::numeric, 'Ly', 'https://images.unsplash.com/photo-1563229871-841846ffb7dd?q=80&w=1000&auto=format&fit=crop', TRUE),
      ('j005', 'Sinh Tố Bơ', 45000::numeric, 'Ly', 'https://images.unsplash.com/photo-1525385133336-247b6c257536?q=80&w=1000&auto=format&fit=crop', FALSE),
      ('c001', 'Cà Phê Cốt Dừa', 45000::numeric, 'Ly', 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=1000', FALSE),
      ('m002', 'Sữa Tươi Trân Châu Đường Đen', 40000::numeric, 'Ly', 'https://images.pexels.com/photos/6065538/pexels-photo-6065538.jpeg?auto=compress&cs=tinysrgb&w=1000', TRUE)
  ) AS payload(category_code, name, base_price, unit, image_url, is_sync_delivery)
)
INSERT INTO items (
  tenant_id,
  category_id,
  name,
  type,
  base_price,
  unit,
  image_url,
  is_sync_delivery,
  is_active
)
SELECT
  target_tenant.tenant_id,
  c.id,
  item_payload.name,
  'SELLABLE',
  item_payload.base_price,
  item_payload.unit,
  item_payload.image_url,
  item_payload.is_sync_delivery,
  TRUE
FROM target_tenant
JOIN item_payload ON TRUE
JOIN category_mapping
  ON category_mapping.payload_category_id = item_payload.category_code
JOIN categories c
  ON c.tenant_id = target_tenant.tenant_id
 AND lower(c.name) = lower(category_mapping.category_name)
WHERE NOT EXISTS (
  SELECT 1
  FROM items i
  WHERE i.tenant_id = target_tenant.tenant_id
    AND lower(i.name) = lower(item_payload.name)
);

WITH target_branch AS (
  SELECT
    '9c006989-cbe7-40ba-9a72-be99b0d0243a'::uuid AS branch_id,
    '2f2ab67e-b472-413f-934f-a10da110ec32'::uuid AS tenant_id
),
item_payload AS (
  SELECT * FROM (
    VALUES
      ('Cà Phê Sữa Đá'),
      ('Bạc Xỉu'),
      ('Cà Phê Muối'),
      ('Cà Phê Trứng'),
      ('Trà Sữa Trân Châu Đường Đen'),
      ('Trà Sữa Matcha'),
      ('Trà Sữa Khoai Môn'),
      ('Trà Sữa Ô Long'),
      ('Trà Đào Cam Sả'),
      ('Trà Vải Khiếm Thân'),
      ('Trà Dâu Tây Đông Du'),
      ('Trà Mãng Cầu'),
      ('Matcha Đá Xay'),
      ('Cookie Đá Xay'),
      ('Sô-cô-la Đá Xay'),
      ('Nước Ép Cam Tươi'),
      ('Nước Ép Dưa Hấu'),
      ('Sinh Tố Bơ'),
      ('Cà Phê Cốt Dừa'),
      ('Sữa Tươi Trân Châu Đường Đen')
  ) AS payload(name)
)
INSERT INTO branch_items (
  branch_id,
  item_id,
  branch_price,
  is_available
)
SELECT
  target_branch.branch_id,
  i.id,
  NULL,
  TRUE
FROM target_branch
JOIN item_payload ON TRUE
JOIN items i
  ON i.tenant_id = target_branch.tenant_id
 AND lower(i.name) = lower(item_payload.name)
WHERE NOT EXISTS (
  SELECT 1
  FROM branch_items bi
  WHERE bi.branch_id = target_branch.branch_id
    AND bi.item_id = i.id
);

COMMIT;
