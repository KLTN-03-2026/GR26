-- ==============================================================================
-- Flyway Migration V22: Plan Limits
-- Thêm columns max_staff, max_menu_items cho bảng plans.
-- Allow max_branches vắng mặt (NULL) = không giới hạn.
-- ==============================================================================

-- 1. Thêm 2 cột mới, mặc định NULL (không giới hạn)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_staff INT DEFAULT NULL;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_menu_items INT DEFAULT NULL;

-- 2. Cho phép max_branches nhận giá trị NULL (không giới hạn)
ALTER TABLE plans ALTER COLUMN max_branches DROP NOT NULL;
ALTER TABLE plans ALTER COLUMN max_branches SET DEFAULT NULL;

-- 3. Đảm bảo gói "Miễn Phí" (free) có tồn tại. Gói này giới hạn chặt: 1 chi nhánh, 3 staff, 10 món.
INSERT INTO plans (id, name, slug, price_monthly, max_branches, max_staff, max_menu_items, features, is_active)
VALUES (
    uuid_generate_v4(), 
    'Miễn Phí', 
    'free', 
    0, 
    1, 
    3, 
    10, 
    '{"POS":true,"INVENTORY":false,"PROMOTION":false,"AI":false,"ADVANCED_REPORT":false}', 
    true
)
ON CONFLICT (slug) DO NOTHING;

-- 4. Update các gói có sẵn theo chuẩn mới.
-- Gói Premium (Cao Cấp) = Toàn quyền, không có limit nào.
UPDATE plans 
SET max_branches = NULL, 
    max_staff = NULL, 
    max_menu_items = NULL 
WHERE slug = 'premium';

-- Gói Standard (Tiêu Chuẩn) = Limit 3 chi nhánh, còn lại không giới hạn
UPDATE plans 
SET max_branches = 3, 
    max_staff = NULL, 
    max_menu_items = NULL 
WHERE slug = 'standard';
