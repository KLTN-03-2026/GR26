-- ============================================================
-- V15: Add INVENTORY_MANAGE permission
-- ============================================================
-- Phục vụ các thao tác: Ghi nhận mẻ sản xuất, Cập nhật ngưỡng tồn kho (min_level)
-- ============================================================

INSERT INTO permissions (id, module, description) 
VALUES ('INVENTORY_MANAGE', 'INVENTORY', 'Quản lý vận hành kho (sản xuất, thiết lập ngưỡng)')
ON CONFLICT (id) DO NOTHING;
