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

-- Ca POS đã được tạo từ V5 (order module).
-- V9 chỉ nâng cấp schema cũ để tương thích shift module, không tạo lại bảng.

ALTER TABLE pos_sessions
    ADD COLUMN IF NOT EXISTS shift_schedule_id UUID REFERENCES shift_schedules(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS note VARCHAR(500);

-- V5 dùng generated column cho cash_difference, nhưng code shift module
-- cần ghi trực tiếp giá trị khi đóng ca nên phải chuyển về cột thường.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'pos_sessions'
          AND column_name = 'cash_difference'
          AND is_generated = 'ALWAYS'
    ) THEN
        ALTER TABLE pos_sessions DROP COLUMN cash_difference;
        ALTER TABLE pos_sessions ADD COLUMN cash_difference DECIMAL(12,2);
    END IF;
END $$;

UPDATE pos_sessions
SET cash_difference = ending_cash_actual - ending_cash_expected
WHERE cash_difference IS NULL
  AND ending_cash_actual IS NOT NULL
  AND ending_cash_expected IS NOT NULL;

ALTER TABLE pos_sessions
    ALTER COLUMN starting_cash SET DEFAULT 0,
    ALTER COLUMN status SET DEFAULT 'OPEN';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_pos_session_status'
    ) THEN
        ALTER TABLE pos_sessions
            ADD CONSTRAINT chk_pos_session_status
            CHECK (status IN ('OPEN', 'CLOSED'));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_pos_end_after_start'
    ) THEN
        ALTER TABLE pos_sessions
            ADD CONSTRAINT chk_pos_end_after_start
            CHECK (end_time IS NULL OR end_time > start_time);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_pos_starting_cash_non_negative'
    ) THEN
        ALTER TABLE pos_sessions
            ADD CONSTRAINT chk_pos_starting_cash_non_negative
            CHECK (starting_cash >= 0);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pos_sessions_branch_status ON pos_sessions(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_tenant        ON pos_sessions(tenant_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_user          ON pos_sessions(opened_by_user_id);

-- =================================================================
-- BUSINESS RULES:
-- 1. RegisterShift: validate không trùng ca (user_id + template_id + date unique)
-- 2. CheckIn: chỉ khi status = SCHEDULED, set status = CHECKED_IN
-- 3. CheckOut: chỉ khi status = CHECKED_IN, set status = COMPLETED
-- 4. Tính overtime: actual_end - template.end_time > 0
-- 5. POS Session: mỗi branch chỉ 1 session OPEN tại 1 thời điểm
-- 6. Khi đóng: cash_difference = ending_cash_actual - ending_cash_expected
-- =================================================================
