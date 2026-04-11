-- ==============================================================================
-- V12: Tách quyền Sơ đồ Bàn thành quyền độc lập
-- 1. Thêm quyền TABLE_VIEW, TABLE_EDIT
-- 2. Migrate tự động cấp TABLE_VIEW cho bất kỳ Role nào đang có ORDER_VIEW
-- 3. Migrate tự động cấp TABLE_EDIT cho bất kỳ Role nào đang có BRANCH_EDIT
-- ==============================================================================

-- Thêm quyền mới vào bảng permissions
INSERT INTO permissions (id, module, description) VALUES
('TABLE_VIEW', 'POS', 'Xem danh sách và sơ đồ bàn'),
('TABLE_EDIT', 'POS', 'Thêm / sửa / xóa / sắp xếp vị trí bàn')
ON CONFLICT (id) DO NOTHING;

-- Migrate: Tự động cấp quyền TABLE_VIEW cho các role đang có quyền ORDER_VIEW
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, 'TABLE_VIEW' 
FROM role_permissions 
WHERE permission_id = 'ORDER_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Migrate: Tự động cấp quyền TABLE_EDIT cho các role đang có quyền BRANCH_EDIT
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, 'TABLE_EDIT' 
FROM role_permissions 
WHERE permission_id = 'BRANCH_EDIT'
ON CONFLICT (role_id, permission_id) DO NOTHING;
