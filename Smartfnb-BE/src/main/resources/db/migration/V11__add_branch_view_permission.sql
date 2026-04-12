-- ==============================================================================
-- V11: Thêm permission BRANCH_VIEW để nhân viên có thể xem danh sách chi nhánh
-- Lý do: BranchController GET /branches cần permission này để nhân viên thường
--        (không có BRANCH_EDIT) vẫn xem được thông tin chi nhánh của mình.
-- ==============================================================================

INSERT INTO permissions (id, module, description) VALUES
('BRANCH_VIEW', 'SYSTEM', 'Xem danh sách và thông tin chi nhánh')
ON CONFLICT (id) DO NOTHING;
