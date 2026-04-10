-- =================================================================
-- V9: Shift Module (S-16)
-- =================================================================
-- Tables: shift_templates, shift_schedules, pos_sessions
-- =================================================================

-- Template khung giờ ca (Sáng / Chiều / Tối / Ca gãy)
CREATE TABLE shift_templates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
    branch_id   UUID NOT NULL REFERENCES branches(id)  ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,   -- VD: "Ca sáng 6h-14h"
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    min_staff   INT NOT NULL DEFAULT 1,
    max_staff   INT NOT NULL DEFAULT 10,
    color       VARCHAR(7),              -- Hex color cho UI calendar (#FF5733)
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_shift_template_name_branch UNIQUE (branch_id, name),
    CONSTRAINT chk_shift_time CHECK (end_time > start_time)
);
CREATE INDEX idx_shift_templates_branch ON shift_templates(branch_id) WHERE is_active = TRUE;
CREATE INDEX idx_shift_templates_tenant ON shift_templates(tenant_id);

-- Ca làm việc thực tế (mỗi người mỗi ngày mỗi ca)
CREATE TABLE shift_schedules (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id)       ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id)       ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id)          ON DELETE RESTRICT,
    shift_template_id   UUID NOT NULL REFERENCES shift_templates(id) ON DELETE RESTRICT,
    date                DATE NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    -- SCHEDULED | CHECKED_IN | COMPLETED | ABSENT | CANCELLED
    checked_in_at       TIMESTAMP,
    checked_out_at      TIMESTAMP,
    actual_start_time   TIME,           -- Giờ check-in thực tế
    actual_end_time     TIME,           -- Giờ check-out thực tế
    overtime_minutes    INT NOT NULL DEFAULT 0,
    note                VARCHAR(500),
    registered_by       UUID REFERENCES users(id) ON DELETE SET NULL,  -- Ai đăng ký ca
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_staff_shift_date UNIQUE (user_id, shift_template_id, date),
    CONSTRAINT chk_shift_status CHECK (
        status IN ('SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'ABSENT', 'CANCELLED')
    )
);
CREATE INDEX idx_shift_schedule_branch_date ON shift_schedules(branch_id, date);
CREATE INDEX idx_shift_schedule_user_date   ON shift_schedules(user_id, date);
CREATE INDEX idx_shift_schedule_tenant      ON shift_schedules(tenant_id, date);
CREATE INDEX idx_shift_schedule_status      ON shift_schedules(branch_id, status)
    WHERE status IN ('SCHEDULED', 'CHECKED_IN');

-- Ca POS (phiên mở quầy — quản lý tiền mặt)
CREATE TABLE pos_sessions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
    branch_id               UUID NOT NULL REFERENCES branches(id)  ON DELETE CASCADE,
    opened_by_user_id       UUID NOT NULL REFERENCES users(id)     ON DELETE RESTRICT,
    closed_by_user_id       UUID          REFERENCES users(id)     ON DELETE SET NULL,
    shift_schedule_id       UUID          REFERENCES shift_schedules(id) ON DELETE SET NULL,
    start_time              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time                TIMESTAMP,
    starting_cash           DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (starting_cash >= 0),
    ending_cash_expected    DECIMAL(12,2),   -- Tính từ starting_cash + cash orders
    ending_cash_actual      DECIMAL(12,2),   -- Tiền mặt kiểm đếm khi đóng ca
    cash_difference         DECIMAL(12,2),   -- ending_actual - ending_expected (có thể âm)
    note                    VARCHAR(500),
    status                  VARCHAR(10) NOT NULL DEFAULT 'OPEN',
    -- OPEN | CLOSED
    CONSTRAINT chk_pos_session_status CHECK (status IN ('OPEN', 'CLOSED')),
    CONSTRAINT chk_pos_end_after_start CHECK (end_time IS NULL OR end_time > start_time)
);
CREATE INDEX idx_pos_sessions_branch_status ON pos_sessions(branch_id, status);
CREATE INDEX idx_pos_sessions_tenant        ON pos_sessions(tenant_id, start_time DESC);
CREATE INDEX idx_pos_sessions_user          ON pos_sessions(opened_by_user_id);

-- =================================================================
-- BUSINESS RULES:
-- 1. RegisterShift: validate không trùng ca (user_id + template_id + date unique)
-- 2. CheckIn: chỉ khi status = SCHEDULED, set status = CHECKED_IN
-- 3. CheckOut: chỉ khi status = CHECKED_IN, set status = COMPLETED
-- 4. Tính overtime: actual_end - template.end_time > 0
-- 5. POS Session: mỗi branch chỉ 1 session OPEN tại 1 thời điểm
-- 6. Khi đóng: cash_difference = ending_cash_actual - ending_cash_expected
-- =================================================================
