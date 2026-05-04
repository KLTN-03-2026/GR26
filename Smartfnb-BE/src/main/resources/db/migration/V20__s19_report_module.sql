-- ============================================================================
-- V20: S-19 Report Module (Inventory & HR Reports)
-- Phần 1: Payroll Tables + HR enhancements
-- ============================================================================

-- ============================================================================
-- 1. ENHANCE POSITIONS TABLE: Thêm base_salary
-- ============================================================================

ALTER TABLE positions
    ADD COLUMN IF NOT EXISTS base_salary DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS description_extended VARCHAR(500),
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Tạo index cho tra cứu hiệu suất
CREATE INDEX IF NOT EXISTS idx_positions_active_tenant 
    ON positions(tenant_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 2. ENHANCE USERS TABLE: Thêm thông tin thanh toán & thuế
-- ============================================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS bank_account VARCHAR(30),
    ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS social_insurance_id VARCHAR(50);

-- Tạo index cho tìm kiếm và filter
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_tax_id_tenant 
    ON users(tenant_id, tax_id) 
    WHERE tax_id IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_bank_account
    ON users(tenant_id, bank_account) 
    WHERE bank_account IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- 3. PAYROLL ENTRIES: Bảng lương tháng chính
-- ============================================================================

CREATE TABLE IF NOT EXISTS payroll_entries (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id                   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    staff_id                    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Thông tin tháng lương
    year_month                  DATE NOT NULL,  -- First day of month (YYYY-MM-01)
    
    -- Salary components
    base_salary                 DECIMAL(12,2) NOT NULL DEFAULT 0,
    working_days                INT NOT NULL DEFAULT 0,      -- Số ngày làm việc hoàn thành
    overtime_hours              DECIMAL(10,2) NOT NULL DEFAULT 0,
    overtime_pay                DECIMAL(12,2) NOT NULL DEFAULT 0,  -- Lương OT
    
    -- Bonuses & Deductions (tính tổng từ payroll_bonuses/deductions)
    total_bonuses               DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_deductions            DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Final salary
    gross_salary                DECIMAL(12,2) NOT NULL DEFAULT 0,  -- Base + OT + Bonus - Deduction
    
    -- Status tracking
    status                      VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    -- DRAFT | SUBMITTED | APPROVED | PAID | REJECTED | CANCELLED
    
    -- Approval workflow
    submitted_at                TIMESTAMP,
    submitted_by                UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at                 TIMESTAMP,
    approved_by                 UUID REFERENCES users(id) ON DELETE SET NULL,
    paid_at                     TIMESTAMP,
    
    -- Payment info
    payment_method              VARCHAR(50),   -- BANK_TRANSFER | CASH
    payment_reference           VARCHAR(100),
    
    -- Notes & audit
    notes                       TEXT,
    created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uq_payroll_staff_month UNIQUE (staff_id, year_month),
    CONSTRAINT chk_payroll_status CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED'
    )),
    CONSTRAINT chk_salary_positive CHECK (
        base_salary >= 0 AND overtime_pay >= 0 AND gross_salary >= 0
    )
);

-- Indices for common queries
CREATE INDEX IF NOT EXISTS idx_payroll_tenant_month 
    ON payroll_entries(tenant_id, year_month DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_branch_month 
    ON payroll_entries(branch_id, year_month DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_staff_month 
    ON payroll_entries(staff_id, year_month DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_status 
    ON payroll_entries(status) WHERE status IN ('DRAFT', 'SUBMITTED', 'APPROVED');
CREATE INDEX IF NOT EXISTS idx_payroll_approved_not_paid 
    ON payroll_entries(branch_id, approved_at) 
    WHERE status = 'APPROVED' AND paid_at IS NULL;

-- ============================================================================
-- 4. PAYROLL DEDUCTIONS: Chi tiết các khoản trừ lương
-- ============================================================================

CREATE TABLE IF NOT EXISTS payroll_deductions (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payroll_entry_id            UUID NOT NULL REFERENCES payroll_entries(id) ON DELETE CASCADE,
    
    -- Deduction details
    reason                      VARCHAR(100) NOT NULL,  
    -- VD: HEALTH_INSURANCE, SOCIAL_INSURANCE, TAX, ADVANCE, LOAN_REPAY
    description                 VARCHAR(500),
    amount                      DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    
    -- Reference to source if needed
    reference_id                VARCHAR(100),  -- Invoice ID, Loan ID, etc.
    
    -- Audit
    created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                  UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_deduction_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_deductions_payroll 
    ON payroll_deductions(payroll_entry_id);
CREATE INDEX IF NOT EXISTS idx_deductions_reason 
    ON payroll_deductions(reason);
CREATE INDEX IF NOT EXISTS idx_deductions_tenant_month 
    ON payroll_deductions(tenant_id, created_at DESC);

-- ============================================================================
-- 5. PAYROLL BONUSES: Chi tiết các khoản thưởng
-- ============================================================================

CREATE TABLE IF NOT EXISTS payroll_bonuses (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payroll_entry_id            UUID NOT NULL REFERENCES payroll_entries(id) ON DELETE CASCADE,
    
    -- Bonus details
    reason                      VARCHAR(100) NOT NULL,  
    -- VD: PERFORMANCE, ATTENDANCE, REFERRAL, RETENTION, OTHER
    description                 VARCHAR(500),
    amount                      DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    
    -- Reference if needed
    reference_id                VARCHAR(100),  -- Campaign ID, etc.
    
    -- Approval if needed
    approved_by                 UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at                 TIMESTAMP,
    
    -- Audit
    created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                  UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_bonus_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_bonuses_payroll 
    ON payroll_bonuses(payroll_entry_id);
CREATE INDEX IF NOT EXISTS idx_bonuses_reason 
    ON payroll_bonuses(reason);
CREATE INDEX IF NOT EXISTS idx_bonuses_tenant_month 
    ON payroll_bonuses(tenant_id, created_at DESC);

-- ============================================================================
-- 6. MONTHLY ATTENDANCE PRE-AGGREGATION (Optional, for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS monthly_attendance_summary (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id                   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    staff_id                    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    year_month                  DATE NOT NULL,  -- First day of month
    
    -- Attendance metrics
    working_days                INT NOT NULL DEFAULT 0,      -- Completed shifts
    overtime_hours              DECIMAL(10,2) NOT NULL DEFAULT 0,
    absent_days                 INT NOT NULL DEFAULT 0,      -- Absent status
    leave_days                  INT NOT NULL DEFAULT 0,      -- On leave
    violation_count             INT NOT NULL DEFAULT 0,      -- Late/early checkout
    
    -- Metadata
    updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uq_attendance_staff_month UNIQUE (staff_id, year_month)
);

CREATE INDEX IF NOT EXISTS idx_attendance_tenant_month 
    ON monthly_attendance_summary(tenant_id, year_month DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_branch_month 
    ON monthly_attendance_summary(branch_id, year_month DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_month 
    ON monthly_attendance_summary(staff_id, year_month DESC);

-- ============================================================================
-- 7. AUDIT LOGGING ENHANCEMENT: Thêm cột cho sensitive access
-- ============================================================================

-- Nếu audit_logs table tồn tại từ V2, thêm cột cho tracking sensitive operations
ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS sensitivity_level VARCHAR(20),  -- LOW | MEDIUM | HIGH | CRITICAL
    ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50),
    ADD COLUMN IF NOT EXISTS resource_id VARCHAR(100);  -- ID of accessed resource

-- Tạo index cho audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_sensitive 
    ON audit_logs(sensitivity_level, created_at DESC) 
    WHERE sensitivity_level IN ('HIGH', 'CRITICAL');

-- ============================================================================
-- 8. SEED PERMISSIONS: Thêm quyền mới cho Reports
-- ============================================================================

INSERT INTO permissions (id, module, description) VALUES
    ('REPORT_INVENTORY', 'REPORT', 'Xem báo cáo kho hàng (tồn kho, hao hụt, COGS)'),
    ('REPORT_HR', 'REPORT', 'Xem báo cáo nhân sự (chấm công, lương, chi phí)'),
    ('PAYROLL_VIEW', 'HR', 'Xem bảng lương'),
    ('PAYROLL_EDIT', 'HR', 'Tạo/sửa/duyệt bảng lương'),
    ('PAYROLL_EXPORT', 'HR', 'Xuất báo cáo payroll')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. COMMENTS & DOCUMENTATION
-- ============================================================================

-- Payroll workflow:
-- 1. System tính tự động working_days, overtime từ shift_schedules
-- 2. Admin add bonuses/deductions via API
-- 3. Status: DRAFT → SUBMITTED → APPROVED → PAID
-- 4. Privacy: Staff only see own payroll (enforced at application layer)

-- Indices strategy:
-- - High cardinality: (tenant_id, year_month) for monthly reports
-- - Status indices: For workflow queries
-- - Composite indices: For date range queries
-- - Partial indices: For active records only (deleted_at IS NULL)

-- ============================================================================
