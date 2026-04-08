\set ON_ERROR_STOP on

-- Seed demo cho menu + kho.
-- Muc tieu:
-- 1. Seed danh muc va mon ban SELLABLE
-- 2. Seed item INGREDIENT / SUB_ASSEMBLY
-- 3. Seed branch_items cho chi nhanh muc tieu
-- 4. Seed recipe cho tung mon
-- 5. Seed ton kho, batch nhap va lich su inventory import
--
-- Cach dung:
-- psql ... \
--   -v owner_email='trial.owner@smartfnb.local' \
--   -v branch_code='CNHCM01' \
--   -f scripts/sql/import-menu-inventory-demo-2026-04-08.sql
--
-- Neu branch_code rong, script se tu dong lay chi nhanh dau tien cua tenant.

BEGIN;

WITH input AS (
    SELECT
        LOWER(BTRIM(:'owner_email'))::text AS owner_email,
        NULLIF(BTRIM(:'branch_code'), '')::text AS branch_code
),
tenant_ctx AS (
    SELECT t.id AS tenant_id, t.name AS tenant_name
    FROM tenants t
    JOIN input i ON LOWER(t.email) = i.owner_email
),
branch_ctx AS (
    SELECT b.id AS branch_id, b.code AS branch_code, b.name AS branch_name, tc.tenant_id
    FROM tenant_ctx tc
    JOIN LATERAL (
        SELECT b.*
        FROM branches b
        JOIN input i ON TRUE
        WHERE b.tenant_id = tc.tenant_id
          AND (
            i.branch_code IS NULL
            OR LOWER(b.code) = LOWER(i.branch_code)
          )
        ORDER BY
            CASE
                WHEN i.branch_code IS NOT NULL AND LOWER(b.code) = LOWER(i.branch_code) THEN 0
                ELSE 1
            END,
            b.created_at ASC,
            b.name ASC
        LIMIT 1
    ) b ON TRUE
),
category_payload AS (
    SELECT * FROM (
        VALUES
            ('Cà phê máy', 'Danh mục cà phê máy và cà phê nền espresso', 1),
            ('Trà trái cây', 'Danh mục trà trái cây và trà mix topping', 2),
            ('Trà sữa', 'Danh mục trà sữa, sữa tươi và nền topping', 3),
            ('Đá xay', 'Danh mục thức uống blended và đá xay', 4),
            ('Nước ép', 'Danh mục nước ép và đồ uống tươi', 5)
    ) AS payload(name, description, display_order)
)
INSERT INTO categories (
    tenant_id,
    name,
    description,
    display_order,
    is_active
)
SELECT
    tc.tenant_id,
    payload.name,
    payload.description,
    payload.display_order,
    TRUE
FROM tenant_ctx tc
JOIN category_payload payload ON TRUE
ON CONFLICT (tenant_id, name) DO UPDATE
SET description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;

WITH input AS (
    SELECT
        LOWER(BTRIM(:'owner_email'))::text AS owner_email
),
tenant_ctx AS (
    SELECT t.id AS tenant_id
    FROM tenants t
    JOIN input i ON LOWER(t.email) = i.owner_email
),
sellable_payload AS (
    SELECT * FROM (
        VALUES
            ('Cà phê máy', 'Cà Phê Sữa Đá', 29000::numeric, 'Ly', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=1000&auto=format&fit=crop', TRUE),
            ('Cà phê máy', 'Bạc Xỉu', 32000::numeric, 'Ly', 'https://images.unsplash.com/photo-1461023233037-340798282361?q=80&w=1000&auto=format&fit=crop', TRUE),
            ('Cà phê máy', 'Cà Phê Muối', 38000::numeric, 'Ly', 'https://images.unsplash.com/photo-1572286258217-40142c1c6a70?q=80&w=1000&auto=format&fit=crop', FALSE),
            ('Trà trái cây', 'Trà Đào Cam Sả', 42000::numeric, 'Ly', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=1000&auto=format&fit=crop', TRUE),
            ('Trà sữa', 'Trà Sữa Trân Châu Đường Đen', 45000::numeric, 'Ly', 'https://images.pexels.com/photos/5946950/pexels-photo-5946950.jpeg?auto=compress&cs=tinysrgb&w=1000', TRUE),
            ('Đá xay', 'Matcha Đá Xay', 49000::numeric, 'Ly', 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?q=80&w=1000&auto=format&fit=crop', FALSE),
            ('Đá xay', 'Sô-cô-la Đá Xay', 52000::numeric, 'Ly', 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?q=80&w=1000&auto=format&fit=crop', FALSE),
            ('Nước ép', 'Nước Cam Tươi', 35000::numeric, 'Ly', 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=1000&auto=format&fit=crop', TRUE)
    ) AS payload(category_name, name, base_price, unit, image_url, is_sync_delivery)
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
    tc.tenant_id,
    c.id,
    payload.name,
    'SELLABLE',
    payload.base_price,
    payload.unit,
    payload.image_url,
    payload.is_sync_delivery,
    TRUE
FROM tenant_ctx tc
JOIN sellable_payload payload ON TRUE
JOIN categories c
  ON c.tenant_id = tc.tenant_id
 AND c.name = payload.category_name
ON CONFLICT (tenant_id, name) DO UPDATE
SET category_id = EXCLUDED.category_id,
    type = EXCLUDED.type,
    base_price = EXCLUDED.base_price,
    unit = EXCLUDED.unit,
    image_url = EXCLUDED.image_url,
    is_sync_delivery = EXCLUDED.is_sync_delivery,
    is_active = TRUE,
    deleted_at = NULL;

WITH input AS (
    SELECT
        LOWER(BTRIM(:'owner_email'))::text AS owner_email
),
tenant_ctx AS (
    SELECT t.id AS tenant_id
    FROM tenants t
    JOIN input i ON LOWER(t.email) = i.owner_email
),
ingredient_payload AS (
    SELECT * FROM (
        VALUES
            ('Espresso Blend', 'INGREDIENT', 'g', 0::numeric),
            ('Sữa đặc', 'INGREDIENT', 'ml', 0::numeric),
            ('Sữa tươi', 'INGREDIENT', 'ml', 0::numeric),
            ('Kem muối nền', 'SUB_ASSEMBLY', 'ml', 0::numeric),
            ('Trà đen', 'INGREDIENT', 'g', 0::numeric),
            ('Syrup đào', 'INGREDIENT', 'ml', 0::numeric),
            ('Đào ngâm', 'INGREDIENT', 'g', 0::numeric),
            ('Sả cây', 'INGREDIENT', 'g', 0::numeric),
            ('Cam vàng', 'INGREDIENT', 'g', 0::numeric),
            ('Bột matcha', 'INGREDIENT', 'g', 0::numeric),
            ('Bột cacao', 'INGREDIENT', 'g', 0::numeric),
            ('Sốt chocolate', 'INGREDIENT', 'ml', 0::numeric),
            ('Trân châu đen nấu sẵn', 'SUB_ASSEMBLY', 'g', 0::numeric),
            ('Syrup đường', 'INGREDIENT', 'ml', 0::numeric),
            ('Đá viên', 'INGREDIENT', 'g', 0::numeric),
            ('Bột sữa', 'INGREDIENT', 'g', 0::numeric),
            ('Kem tươi', 'INGREDIENT', 'ml', 0::numeric)
    ) AS payload(name, type, unit, base_price)
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
    tc.tenant_id,
    NULL,
    payload.name,
    payload.type,
    payload.base_price,
    payload.unit,
    NULL,
    FALSE,
    TRUE
FROM tenant_ctx tc
JOIN ingredient_payload payload ON TRUE
ON CONFLICT (tenant_id, name) DO UPDATE
SET category_id = NULL,
    type = EXCLUDED.type,
    base_price = EXCLUDED.base_price,
    unit = EXCLUDED.unit,
    image_url = NULL,
    is_sync_delivery = FALSE,
    is_active = TRUE,
    deleted_at = NULL;

WITH input AS (
    SELECT
        LOWER(BTRIM(:'owner_email'))::text AS owner_email,
        NULLIF(BTRIM(:'branch_code'), '')::text AS branch_code
),
tenant_ctx AS (
    SELECT t.id AS tenant_id
    FROM tenants t
    JOIN input i ON LOWER(t.email) = i.owner_email
),
branch_ctx AS (
    SELECT b.id AS branch_id, tc.tenant_id
    FROM tenant_ctx tc
    JOIN LATERAL (
        SELECT b.*
        FROM branches b
        JOIN input i ON TRUE
        WHERE b.tenant_id = tc.tenant_id
          AND (
            i.branch_code IS NULL
            OR LOWER(b.code) = LOWER(i.branch_code)
          )
        ORDER BY
            CASE
                WHEN i.branch_code IS NOT NULL AND LOWER(b.code) = LOWER(i.branch_code) THEN 0
                ELSE 1
            END,
            b.created_at ASC,
            b.name ASC
        LIMIT 1
    ) b ON TRUE
),
branch_item_payload AS (
    SELECT * FROM (
        VALUES
            ('Cà Phê Sữa Đá', NULL::numeric, TRUE),
            ('Bạc Xỉu', NULL::numeric, TRUE),
            ('Cà Phê Muối', 39000::numeric, TRUE),
            ('Trà Đào Cam Sả', NULL::numeric, TRUE),
            ('Trà Sữa Trân Châu Đường Đen', NULL::numeric, TRUE),
            ('Matcha Đá Xay', 52000::numeric, TRUE),
            ('Sô-cô-la Đá Xay', NULL::numeric, TRUE),
            ('Nước Cam Tươi', 36000::numeric, TRUE)
    ) AS payload(item_name, branch_price, is_available)
)
INSERT INTO branch_items (
    branch_id,
    item_id,
    branch_price,
    is_available
)
SELECT
    bc.branch_id,
    i.id,
    payload.branch_price,
    payload.is_available
FROM branch_ctx bc
JOIN tenant_ctx tc ON tc.tenant_id = bc.tenant_id
JOIN branch_item_payload payload ON TRUE
JOIN items i
  ON i.tenant_id = tc.tenant_id
 AND i.name = payload.item_name
ON CONFLICT (branch_id, item_id) DO UPDATE
SET branch_price = EXCLUDED.branch_price,
    is_available = EXCLUDED.is_available;

WITH input AS (
    SELECT LOWER(BTRIM(:'owner_email'))::text AS owner_email
),
tenant_ctx AS (
    SELECT t.id AS tenant_id
    FROM tenants t
    JOIN input i ON LOWER(t.email) = i.owner_email
),
recipe_payload AS (
    SELECT * FROM (
        VALUES
            ('Cà Phê Sữa Đá', 'Espresso Blend', 18.0000::numeric, 'g'),
            ('Cà Phê Sữa Đá', 'Sữa đặc', 40.0000::numeric, 'ml'),
            ('Cà Phê Sữa Đá', 'Đá viên', 120.0000::numeric, 'g'),

            ('Bạc Xỉu', 'Espresso Blend', 12.0000::numeric, 'g'),
            ('Bạc Xỉu', 'Sữa đặc', 35.0000::numeric, 'ml'),
            ('Bạc Xỉu', 'Sữa tươi', 120.0000::numeric, 'ml'),
            ('Bạc Xỉu', 'Đá viên', 120.0000::numeric, 'g'),

            ('Cà Phê Muối', 'Espresso Blend', 18.0000::numeric, 'g'),
            ('Cà Phê Muối', 'Sữa đặc', 25.0000::numeric, 'ml'),
            ('Cà Phê Muối', 'Kem muối nền', 50.0000::numeric, 'ml'),
            ('Cà Phê Muối', 'Đá viên', 100.0000::numeric, 'g'),

            ('Trà Đào Cam Sả', 'Trà đen', 12.0000::numeric, 'g'),
            ('Trà Đào Cam Sả', 'Syrup đào', 30.0000::numeric, 'ml'),
            ('Trà Đào Cam Sả', 'Đào ngâm', 60.0000::numeric, 'g'),
            ('Trà Đào Cam Sả', 'Cam vàng', 40.0000::numeric, 'g'),
            ('Trà Đào Cam Sả', 'Sả cây', 15.0000::numeric, 'g'),
            ('Trà Đào Cam Sả', 'Đá viên', 150.0000::numeric, 'g'),

            ('Trà Sữa Trân Châu Đường Đen', 'Trà đen', 10.0000::numeric, 'g'),
            ('Trà Sữa Trân Châu Đường Đen', 'Bột sữa', 35.0000::numeric, 'g'),
            ('Trà Sữa Trân Châu Đường Đen', 'Syrup đường', 25.0000::numeric, 'ml'),
            ('Trà Sữa Trân Châu Đường Đen', 'Sữa tươi', 80.0000::numeric, 'ml'),
            ('Trà Sữa Trân Châu Đường Đen', 'Trân châu đen nấu sẵn', 70.0000::numeric, 'g'),
            ('Trà Sữa Trân Châu Đường Đen', 'Đá viên', 120.0000::numeric, 'g'),

            ('Matcha Đá Xay', 'Bột matcha', 18.0000::numeric, 'g'),
            ('Matcha Đá Xay', 'Sữa tươi', 120.0000::numeric, 'ml'),
            ('Matcha Đá Xay', 'Syrup đường', 20.0000::numeric, 'ml'),
            ('Matcha Đá Xay', 'Kem tươi', 40.0000::numeric, 'ml'),
            ('Matcha Đá Xay', 'Đá viên', 180.0000::numeric, 'g'),

            ('Sô-cô-la Đá Xay', 'Bột cacao', 20.0000::numeric, 'g'),
            ('Sô-cô-la Đá Xay', 'Sốt chocolate', 30.0000::numeric, 'ml'),
            ('Sô-cô-la Đá Xay', 'Sữa tươi', 130.0000::numeric, 'ml'),
            ('Sô-cô-la Đá Xay', 'Kem tươi', 30.0000::numeric, 'ml'),
            ('Sô-cô-la Đá Xay', 'Đá viên', 180.0000::numeric, 'g'),

            ('Nước Cam Tươi', 'Cam vàng', 180.0000::numeric, 'g'),
            ('Nước Cam Tươi', 'Syrup đường', 15.0000::numeric, 'ml'),
            ('Nước Cam Tươi', 'Đá viên', 120.0000::numeric, 'g')
    ) AS payload(target_item_name, ingredient_item_name, quantity, unit)
)
INSERT INTO recipes (
    tenant_id,
    target_item_id,
    ingredient_item_id,
    quantity,
    unit
)
SELECT
    tc.tenant_id,
    sellable.id,
    ingredient.id,
    payload.quantity,
    payload.unit
FROM tenant_ctx tc
JOIN recipe_payload payload ON TRUE
JOIN items sellable
  ON sellable.tenant_id = tc.tenant_id
 AND sellable.name = payload.target_item_name
JOIN items ingredient
  ON ingredient.tenant_id = tc.tenant_id
 AND ingredient.name = payload.ingredient_item_name
ON CONFLICT (target_item_id, ingredient_item_id) DO UPDATE
SET quantity = EXCLUDED.quantity,
    unit = EXCLUDED.unit;

WITH input AS (
    SELECT
        LOWER(BTRIM(:'owner_email'))::text AS owner_email,
        NULLIF(BTRIM(:'branch_code'), '')::text AS branch_code
),
tenant_ctx AS (
    SELECT t.id AS tenant_id
    FROM tenants t
    JOIN input i ON LOWER(t.email) = i.owner_email
),
branch_ctx AS (
    SELECT b.id AS branch_id, tc.tenant_id
    FROM tenant_ctx tc
    JOIN LATERAL (
        SELECT b.*
        FROM branches b
        JOIN input i ON TRUE
        WHERE b.tenant_id = tc.tenant_id
          AND (
            i.branch_code IS NULL
            OR LOWER(b.code) = LOWER(i.branch_code)
          )
        ORDER BY
            CASE
                WHEN i.branch_code IS NOT NULL AND LOWER(b.code) = LOWER(i.branch_code) THEN 0
                ELSE 1
            END,
            b.created_at ASC,
            b.name ASC
        LIMIT 1
    ) b ON TRUE
),
inventory_payload AS (
    SELECT * FROM (
        VALUES
            ('Espresso Blend', 6000.0000::numeric, 800.0000::numeric, 1.4500::numeric, NULL::int),
            ('Sữa đặc', 4500.0000::numeric, 600.0000::numeric, 0.0950::numeric, 90),
            ('Sữa tươi', 8000.0000::numeric, 1000.0000::numeric, 0.0420::numeric, 10),
            ('Kem muối nền', 2500.0000::numeric, 400.0000::numeric, 0.1200::numeric, 5),
            ('Trà đen', 2500.0000::numeric, 300.0000::numeric, 0.3200::numeric, NULL::int),
            ('Syrup đào', 2000.0000::numeric, 250.0000::numeric, 0.1800::numeric, 60),
            ('Đào ngâm', 3000.0000::numeric, 500.0000::numeric, 0.1400::numeric, 60),
            ('Sả cây', 1500.0000::numeric, 250.0000::numeric, 0.0300::numeric, 5),
            ('Cam vàng', 5000.0000::numeric, 800.0000::numeric, 0.0550::numeric, 7),
            ('Bột matcha', 1200.0000::numeric, 150.0000::numeric, 1.2500::numeric, 120),
            ('Bột cacao', 1500.0000::numeric, 200.0000::numeric, 0.7800::numeric, 120),
            ('Sốt chocolate', 2500.0000::numeric, 350.0000::numeric, 0.1600::numeric, 60),
            ('Trân châu đen nấu sẵn', 3500.0000::numeric, 500.0000::numeric, 0.0700::numeric, 3),
            ('Syrup đường', 5000.0000::numeric, 500.0000::numeric, 0.0250::numeric, 30),
            ('Đá viên', 20000.0000::numeric, 3000.0000::numeric, 0.0020::numeric, NULL::int),
            ('Bột sữa', 3500.0000::numeric, 400.0000::numeric, 0.0850::numeric, 90),
            ('Kem tươi', 2500.0000::numeric, 300.0000::numeric, 0.1100::numeric, 7)
    ) AS payload(item_name, quantity, min_level, cost_per_unit, expires_after_days)
)
INSERT INTO inventory_balances (
    tenant_id,
    branch_id,
    item_id,
    item_name,
    unit,
    quantity,
    min_level,
    version,
    updated_at
)
SELECT
    bc.tenant_id,
    bc.branch_id,
    item.id,
    item.name,
    item.unit,
    payload.quantity,
    payload.min_level,
    0,
    CURRENT_TIMESTAMP
FROM branch_ctx bc
JOIN inventory_payload payload ON TRUE
JOIN items item
  ON item.tenant_id = bc.tenant_id
 AND item.name = payload.item_name
ON CONFLICT (branch_id, item_id) DO UPDATE
SET item_name = EXCLUDED.item_name,
    unit = EXCLUDED.unit,
    quantity = EXCLUDED.quantity,
    min_level = EXCLUDED.min_level,
    updated_at = CURRENT_TIMESTAMP;

WITH input AS (
    SELECT
        LOWER(BTRIM(:'owner_email'))::text AS owner_email,
        NULLIF(BTRIM(:'branch_code'), '')::text AS branch_code
),
tenant_ctx AS (
    SELECT t.id AS tenant_id
    FROM tenants t
    JOIN input i ON LOWER(t.email) = i.owner_email
),
branch_ctx AS (
    SELECT b.id AS branch_id, tc.tenant_id
    FROM tenant_ctx tc
    JOIN LATERAL (
        SELECT b.*
        FROM branches b
        JOIN input i ON TRUE
        WHERE b.tenant_id = tc.tenant_id
          AND (
            i.branch_code IS NULL
            OR LOWER(b.code) = LOWER(i.branch_code)
          )
        ORDER BY
            CASE
                WHEN i.branch_code IS NOT NULL AND LOWER(b.code) = LOWER(i.branch_code) THEN 0
                ELSE 1
            END,
            b.created_at ASC,
            b.name ASC
        LIMIT 1
    ) b ON TRUE
),
inventory_payload AS (
    SELECT * FROM (
        VALUES
            ('Espresso Blend', 6000.0000::numeric, 1.4500::numeric, NULL::int),
            ('Sữa đặc', 4500.0000::numeric, 0.0950::numeric, 90),
            ('Sữa tươi', 8000.0000::numeric, 0.0420::numeric, 10),
            ('Kem muối nền', 2500.0000::numeric, 0.1200::numeric, 5),
            ('Trà đen', 2500.0000::numeric, 0.3200::numeric, NULL::int),
            ('Syrup đào', 2000.0000::numeric, 0.1800::numeric, 60),
            ('Đào ngâm', 3000.0000::numeric, 0.1400::numeric, 60),
            ('Sả cây', 1500.0000::numeric, 0.0300::numeric, 5),
            ('Cam vàng', 5000.0000::numeric, 0.0550::numeric, 7),
            ('Bột matcha', 1200.0000::numeric, 1.2500::numeric, 120),
            ('Bột cacao', 1500.0000::numeric, 0.7800::numeric, 120),
            ('Sốt chocolate', 2500.0000::numeric, 0.1600::numeric, 60),
            ('Trân châu đen nấu sẵn', 3500.0000::numeric, 0.0700::numeric, 3),
            ('Syrup đường', 5000.0000::numeric, 0.0250::numeric, 30),
            ('Đá viên', 20000.0000::numeric, 0.0020::numeric, NULL::int),
            ('Bột sữa', 3500.0000::numeric, 0.0850::numeric, 90),
            ('Kem tươi', 2500.0000::numeric, 0.1100::numeric, 7)
    ) AS payload(item_name, quantity, cost_per_unit, expires_after_days)
)
INSERT INTO stock_batches (
    id,
    tenant_id,
    branch_id,
    item_id,
    supplier_id,
    quantity_initial,
    quantity_remaining,
    cost_per_unit,
    imported_at,
    expires_at,
    created_at
)
SELECT
    uuid_generate_v5(
        uuid_ns_url(),
        CONCAT(bc.tenant_id::text, ':', bc.branch_id::text, ':', item.id::text, ':seed-demo-batch')
    ) AS batch_id,
    bc.tenant_id,
    bc.branch_id,
    item.id,
    NULL,
    payload.quantity,
    payload.quantity,
    payload.cost_per_unit,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CASE
        WHEN payload.expires_after_days IS NULL THEN NULL
        ELSE CURRENT_TIMESTAMP + MAKE_INTERVAL(days => payload.expires_after_days)
    END,
    CURRENT_TIMESTAMP
FROM branch_ctx bc
JOIN inventory_payload payload ON TRUE
JOIN items item
  ON item.tenant_id = bc.tenant_id
 AND item.name = payload.item_name
ON CONFLICT (id) DO UPDATE
SET quantity_initial = EXCLUDED.quantity_initial,
    quantity_remaining = EXCLUDED.quantity_remaining,
    cost_per_unit = EXCLUDED.cost_per_unit,
    imported_at = EXCLUDED.imported_at,
    expires_at = EXCLUDED.expires_at,
    created_at = EXCLUDED.created_at;

WITH input AS (
    SELECT
        LOWER(BTRIM(:'owner_email'))::text AS owner_email,
        NULLIF(BTRIM(:'branch_code'), '')::text AS branch_code
),
tenant_ctx AS (
    SELECT t.id AS tenant_id
    FROM tenants t
    JOIN input i ON LOWER(t.email) = i.owner_email
),
branch_ctx AS (
    SELECT b.id AS branch_id, tc.tenant_id
    FROM tenant_ctx tc
    JOIN LATERAL (
        SELECT b.*
        FROM branches b
        JOIN input i ON TRUE
        WHERE b.tenant_id = tc.tenant_id
          AND (
            i.branch_code IS NULL
            OR LOWER(b.code) = LOWER(i.branch_code)
          )
        ORDER BY
            CASE
                WHEN i.branch_code IS NOT NULL AND LOWER(b.code) = LOWER(i.branch_code) THEN 0
                ELSE 1
            END,
            b.created_at ASC,
            b.name ASC
        LIMIT 1
    ) b ON TRUE
),
actor_ctx AS (
    SELECT u.id AS user_id, bc.branch_id, bc.tenant_id
    FROM branch_ctx bc
    LEFT JOIN LATERAL (
        SELECT u.id
        FROM users u
        WHERE u.tenant_id = bc.tenant_id
          AND u.status = 'ACTIVE'
        ORDER BY u.created_at ASC
        LIMIT 1
    ) u ON TRUE
),
inventory_payload AS (
    SELECT * FROM (
        VALUES
            ('Espresso Blend', 6000.0000::numeric, 1.4500::numeric),
            ('Sữa đặc', 4500.0000::numeric, 0.0950::numeric),
            ('Sữa tươi', 8000.0000::numeric, 0.0420::numeric),
            ('Kem muối nền', 2500.0000::numeric, 0.1200::numeric),
            ('Trà đen', 2500.0000::numeric, 0.3200::numeric),
            ('Syrup đào', 2000.0000::numeric, 0.1800::numeric),
            ('Đào ngâm', 3000.0000::numeric, 0.1400::numeric),
            ('Sả cây', 1500.0000::numeric, 0.0300::numeric),
            ('Cam vàng', 5000.0000::numeric, 0.0550::numeric),
            ('Bột matcha', 1200.0000::numeric, 1.2500::numeric),
            ('Bột cacao', 1500.0000::numeric, 0.7800::numeric),
            ('Sốt chocolate', 2500.0000::numeric, 0.1600::numeric),
            ('Trân châu đen nấu sẵn', 3500.0000::numeric, 0.0700::numeric),
            ('Syrup đường', 5000.0000::numeric, 0.0250::numeric),
            ('Đá viên', 20000.0000::numeric, 0.0020::numeric),
            ('Bột sữa', 3500.0000::numeric, 0.0850::numeric),
            ('Kem tươi', 2500.0000::numeric, 0.1100::numeric)
    ) AS payload(item_name, quantity, cost_per_unit)
)
INSERT INTO inventory_transactions (
    id,
    tenant_id,
    branch_id,
    item_id,
    user_id,
    batch_id,
    type,
    quantity,
    cost_per_unit,
    reference_id,
    reference_type,
    note,
    created_at
)
SELECT
    uuid_generate_v5(
        uuid_ns_url(),
        CONCAT(ac.tenant_id::text, ':', ac.branch_id::text, ':', item.id::text, ':seed-demo-import-tx')
    ) AS transaction_id,
    ac.tenant_id,
    ac.branch_id,
    item.id,
    ac.user_id,
    uuid_generate_v5(
        uuid_ns_url(),
        CONCAT(ac.tenant_id::text, ':', ac.branch_id::text, ':', item.id::text, ':seed-demo-batch')
    ) AS batch_id,
    'IMPORT',
    payload.quantity,
    payload.cost_per_unit,
    NULL,
    'MANUAL',
    'Seed demo menu + kho 2026-04-08',
    CURRENT_TIMESTAMP
FROM actor_ctx ac
JOIN inventory_payload payload ON TRUE
JOIN items item
  ON item.tenant_id = ac.tenant_id
 AND item.name = payload.item_name
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id,
    batch_id = EXCLUDED.batch_id,
    quantity = EXCLUDED.quantity,
    cost_per_unit = EXCLUDED.cost_per_unit,
    note = EXCLUDED.note,
    created_at = EXCLUDED.created_at;

COMMIT;
