-- Migration for Expense Module & Permissions
-- Cập nhật quyền cho Quản lý chi tiêu (Expense)

-- Tạo bảng expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    expense_date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('CASH', 'TRANSFER', 'QR_CODE')),
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL
);

-- Indexes 
CREATE INDEX idx_expenses_tenant_branch ON expenses(tenant_id, branch_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_deleted ON expenses(deleted);

-- Thêm quyền EXPENSE_MANAGE, EXPENSE_VIEW (theo schema permissions: id, module, description)
INSERT INTO permissions (id, module, description) VALUES 
('EXPENSE_MANAGE', 'EXPENSE', 'Cho phép tạo, sửa, xóa phiếu chi'),
('EXPENSE_VIEW', 'EXPENSE', 'Cho phép xem lịch sử và chi tiết phiếu chi');

-- Hệ thống cấp quyền động cho Tenant sẽ được quản lý bởi Frontend qua chức năng phân quyền. (Role động theo Tenant).
