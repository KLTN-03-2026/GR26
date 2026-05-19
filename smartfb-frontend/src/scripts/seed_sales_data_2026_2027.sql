-- Seed dữ liệu bán hàng demo từ 2026-05-18 đến 2027-05-17.
-- Script idempotent: dùng UUID v5 deterministic và ON CONFLICT để chạy lại không tạo trùng.

\set ON_ERROR_STOP on

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '15min';

SELECT setseed(0.260517);

CREATE TEMP TABLE seed_constants ON COMMIT DROP AS
SELECT
    '6bb03956-2821-415f-8bbf-43e3e87cba83'::uuid AS tenant_id,
    '00000000-0000-0000-0000-000000000517'::uuid AS namespace_id,
    DATE '2026-05-01' AS start_date,
    DATE '2027-05-17' AS end_date;

-- Dọn các dòng seed phụ thuộc chi tiết món trước khi reinsert để script idempotent khi công thức chọn món thay đổi.
DELETE FROM inventory_transactions
WHERE note IN (
    'Seed nhập kho dự phòng cho dữ liệu bán hàng 2026-2027',
    'Seed trừ kho theo công thức món bán 2026-2027'
);

DELETE FROM invoice_items ii
WHERE EXISTS (
    SELECT 1
    FROM invoices inv
    WHERE inv.id = ii.invoice_id
      AND inv.invoice_number LIKE 'SEEDINV-%'
);

DELETE FROM invoices
WHERE invoice_number LIKE 'SEEDINV-%';

DELETE FROM payments p
USING orders o
WHERE p.order_id = o.id
  AND o.order_number LIKE 'SEED-%';

DELETE FROM order_status_logs osl
USING orders o
WHERE osl.order_id = o.id
  AND o.order_number LIKE 'SEED-%';

DELETE FROM order_items oi
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.id = oi.order_id
      AND o.order_number LIKE 'SEED-%'
);

DELETE FROM orders
WHERE order_number LIKE 'SEED-%';

DELETE FROM daily_item_stats dis
USING seed_constants c
WHERE dis.date BETWEEN c.start_date AND c.end_date
  AND dis.id = uuid_generate_v5(c.namespace_id, 'daily-item:' || dis.branch_id || ':' || dis.item_id || ':' || dis.date);

DELETE FROM hourly_revenue_stats hrs
USING seed_constants c
WHERE hrs.date BETWEEN c.start_date AND c.end_date
  AND hrs.id = uuid_generate_v5(c.namespace_id, 'hourly-revenue:' || hrs.branch_id || ':' || hrs.date || ':' || hrs.hour);

DELETE FROM daily_revenue_summaries dr
USING seed_constants c
WHERE dr.date BETWEEN c.start_date AND c.end_date
  AND dr.id = uuid_generate_v5(c.namespace_id, 'daily-revenue:' || dr.branch_id || ':' || dr.date);

-- Bổ sung nhân viên demo để các chi nhánh active có đủ thu ngân, pha chế, quản lý.
WITH source_staff AS (
    SELECT *
    FROM (VALUES
        ('skt-cashier-2026',  'Nguyễn Minh Anh', 'seed.skt.cashier@smartfnb.local',  '0902606001', 'NV-SEED-SKT-TN-001', 'Thu ngân', 'CASHIER',        'SKT T1', DATE '2026-05-01'),
        ('skt-barista-2026',  'Trần Quốc Bảo',   'seed.skt.barista@smartfnb.local',  '0902606002', 'NV-SEED-SKT-PC-002', 'Pha chế',  'BARISTA',        'SKT T1', DATE '2026-05-01'),
        ('skt-manager-2026',  'Lê Thu Hà',       'seed.skt.manager@smartfnb.local',  '0902606003', 'NV-SEED-SKT-QL-003', 'Quản lý',  'BRANCH_MANAGER', 'SKT T1', DATE '2026-05-01'),
        ('skt-cashier-2027',  'Phạm Gia Huy',    'seed.skt.cashier2@smartfnb.local', '0902606004', 'NV-SEED-SKT-TN-004', 'Thu ngân', 'CASHIER',        'SKT T1', DATE '2026-08-01'),
        ('geng-cashier-2026', 'Đặng Hoàng Nam',  'seed.geng.cashier@smartfnb.local', '0902606011', 'NV-SEED-GEN-TN-011', 'Thu ngân', 'CASHIER',        'GENG',   DATE '2026-05-01'),
        ('geng-barista-2026', 'Vũ Khánh Linh',   'seed.geng.barista@smartfnb.local', '0902606012', 'NV-SEED-GEN-PC-012', 'Pha chế',  'BARISTA',        'GENG',   DATE '2026-05-01'),
        ('geng-manager-2026', 'Bùi Đức Duy',     'seed.geng.manager@smartfnb.local', '0902606013', 'NV-SEED-GEN-QL-013', 'Quản lý',  'BRANCH_MANAGER', 'GENG',   DATE '2026-05-01'),
        ('geng-cashier-2027', 'Hoàng Mai Chi',   'seed.geng.cashier2@smartfnb.local','0902606014', 'NV-SEED-GEN-TN-014', 'Thu ngân', 'CASHIER',        'GENG',   DATE '2026-08-01')
    ) AS s(seed_key, full_name, email, phone, employee_code, position_name, role_name, branch_name, hire_date)
),
staff_rows AS (
    SELECT
        uuid_generate_v5(c.namespace_id, 'staff:' || s.seed_key) AS id,
        c.tenant_id,
        s.full_name,
        s.email,
        s.phone,
        s.employee_code,
        p.id AS position_id,
        s.hire_date
    FROM source_staff s
    CROSS JOIN seed_constants c
    JOIN positions p ON p.tenant_id = c.tenant_id AND p.name = s.position_name
)
INSERT INTO users (
    id, tenant_id, full_name, email, phone, password_hash, pos_pin,
    status, position_id, employee_code, hire_date, created_at
)
SELECT
    id,
    tenant_id,
    full_name,
    email,
    phone,
    '$2a$10$seeded.smartfnb.demo.password.hash',
    '$2a$10$seeded.smartfnb.demo.pin.hash',
    'ACTIVE',
    position_id,
    employee_code,
    hire_date,
    hire_date::timestamp
FROM staff_rows
ON CONFLICT (tenant_id, email) DO UPDATE
SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    status = 'ACTIVE',
    position_id = EXCLUDED.position_id,
    employee_code = EXCLUDED.employee_code,
    hire_date = EXCLUDED.hire_date,
    deleted_at = NULL;

WITH source_staff AS (
    SELECT *
    FROM (VALUES
        ('seed.skt.cashier@smartfnb.local',   'CASHIER',        'SKT T1'),
        ('seed.skt.barista@smartfnb.local',   'BARISTA',        'SKT T1'),
        ('seed.skt.manager@smartfnb.local',   'BRANCH_MANAGER', 'SKT T1'),
        ('seed.skt.cashier2@smartfnb.local',  'CASHIER',        'SKT T1'),
        ('seed.geng.cashier@smartfnb.local',  'CASHIER',        'GENG'),
        ('seed.geng.barista@smartfnb.local',  'BARISTA',        'GENG'),
        ('seed.geng.manager@smartfnb.local',  'BRANCH_MANAGER', 'GENG'),
        ('seed.geng.cashier2@smartfnb.local', 'CASHIER',        'GENG')
    ) AS s(email, role_name, branch_name)
),
resolved AS (
    SELECT u.id AS user_id, r.id AS role_id, b.id AS branch_id
    FROM source_staff s
    CROSS JOIN seed_constants c
    JOIN users u ON u.tenant_id = c.tenant_id AND u.email = s.email
    JOIN roles r ON r.tenant_id = c.tenant_id AND r.name = s.role_name
    JOIN branches b ON b.tenant_id = c.tenant_id AND b.name = s.branch_name
)
INSERT INTO branch_users (user_id, branch_id, is_primary_branch, assigned_at)
SELECT user_id, branch_id, TRUE, TIMESTAMP '2026-05-18 06:00:00'
FROM resolved
ON CONFLICT (user_id, branch_id) DO UPDATE
SET is_primary_branch = EXCLUDED.is_primary_branch;

WITH source_staff AS (
    SELECT *
    FROM (VALUES
        ('seed.skt.cashier@smartfnb.local',   'CASHIER'),
        ('seed.skt.barista@smartfnb.local',   'BARISTA'),
        ('seed.skt.manager@smartfnb.local',   'BRANCH_MANAGER'),
        ('seed.skt.cashier2@smartfnb.local',  'CASHIER'),
        ('seed.geng.cashier@smartfnb.local',  'CASHIER'),
        ('seed.geng.barista@smartfnb.local',  'BARISTA'),
        ('seed.geng.manager@smartfnb.local',  'BRANCH_MANAGER'),
        ('seed.geng.cashier2@smartfnb.local', 'CASHIER')
    ) AS s(email, role_name)
),
resolved AS (
    SELECT u.id AS user_id, r.id AS role_id
    FROM source_staff s
    CROSS JOIN seed_constants c
    JOIN users u ON u.tenant_id = c.tenant_id AND u.email = s.email
    JOIN roles r ON r.tenant_id = c.tenant_id AND r.name = s.role_name
)
INSERT INTO user_roles (user_id, role_id)
SELECT user_id, role_id
FROM resolved
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Chuẩn hoá ca làm 3 khung/ngày cho các chi nhánh active.
WITH source_templates AS (
    SELECT *
    FROM (VALUES
        ('SKT T1', 'Ca sáng',  TIME '07:00', TIME '12:00', '#2563EB'),
        ('SKT T1', 'Ca chiều', TIME '12:00', TIME '17:00', '#059669'),
        ('SKT T1', 'Ca tối',   TIME '17:00', TIME '23:00', '#DC2626'),
        ('GENG',   'Ca sáng',  TIME '07:00', TIME '12:00', '#2563EB'),
        ('GENG',   'Ca chiều', TIME '12:00', TIME '17:00', '#059669'),
        ('GENG',   'Ca tối',   TIME '17:00', TIME '23:00', '#DC2626')
    ) AS t(branch_name, name, start_time, end_time, color)
)
INSERT INTO shift_templates (id, tenant_id, branch_id, name, start_time, end_time, min_staff, max_staff, color, is_active, created_at)
SELECT
    uuid_generate_v5(c.namespace_id, 'shift-template:' || b.id || ':' || t.name),
    c.tenant_id,
    b.id,
    t.name,
    t.start_time,
    t.end_time,
    1,
    6,
    t.color,
    TRUE,
    TIMESTAMP '2026-05-18 06:00:00'
FROM source_templates t
CROSS JOIN seed_constants c
JOIN branches b ON b.tenant_id = c.tenant_id AND b.name = t.branch_name
ON CONFLICT (branch_id, name) DO UPDATE
SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    max_staff = EXCLUDED.max_staff,
    color = EXCLUDED.color,
    is_active = TRUE;

CREATE TEMP TABLE seed_dates ON COMMIT DROP AS
SELECT
    gs::date AS work_date,
    (ROW_NUMBER() OVER (ORDER BY gs) - 1)::int AS date_idx
FROM seed_constants c,
     generate_series(c.start_date, c.end_date, INTERVAL '1 day') AS gs;

CREATE TEMP TABLE seed_shift_assignments ON COMMIT DROP AS
WITH assignment_source AS (
    SELECT *
    FROM (VALUES
        ('SKT T1', 'Ca sáng',  'seed.skt.cashier@smartfnb.local'),
        ('SKT T1', 'Ca sáng',  'seed.skt.barista@smartfnb.local'),
        ('SKT T1', 'Ca chiều', 'seed.skt.cashier2@smartfnb.local'),
        ('SKT T1', 'Ca chiều', 'seed.skt.barista@smartfnb.local'),
        ('SKT T1', 'Ca tối',   'seed.skt.manager@smartfnb.local'),
        ('SKT T1', 'Ca tối',   'seed.skt.cashier@smartfnb.local'),
        ('GENG',   'Ca sáng',  'seed.geng.cashier@smartfnb.local'),
        ('GENG',   'Ca sáng',  'seed.geng.barista@smartfnb.local'),
        ('GENG',   'Ca chiều', 'seed.geng.cashier2@smartfnb.local'),
        ('GENG',   'Ca chiều', 'seed.geng.barista@smartfnb.local'),
        ('GENG',   'Ca tối',   'seed.geng.manager@smartfnb.local'),
        ('GENG',   'Ca tối',   'seed.geng.cashier@smartfnb.local')
    ) AS a(branch_name, shift_name, staff_email)
)
SELECT
    b.id AS branch_id,
    st.id AS shift_template_id,
    st.name AS shift_name,
    st.start_time,
    st.end_time,
    u.id AS user_id,
    u.email AS staff_email
FROM assignment_source a
CROSS JOIN seed_constants c
JOIN branches b ON b.tenant_id = c.tenant_id AND b.name = a.branch_name
JOIN shift_templates st ON st.branch_id = b.id AND st.name = a.shift_name
JOIN users u ON u.tenant_id = c.tenant_id AND u.email = a.staff_email;

INSERT INTO shift_schedules (
    id, tenant_id, branch_id, user_id, shift_template_id, date, status,
    checked_in_at, checked_out_at, actual_start_time, actual_end_time,
    overtime_minutes, note, registered_by, created_at
)
SELECT
    uuid_generate_v5(c.namespace_id, 'shift-schedule:' || a.user_id || ':' || a.shift_template_id || ':' || d.work_date),
    c.tenant_id,
    a.branch_id,
    a.user_id,
    a.shift_template_id,
    d.work_date,
    'COMPLETED',
    d.work_date + a.start_time + (((d.date_idx + LENGTH(a.staff_email)) % 7) * INTERVAL '1 minute'),
    d.work_date + a.end_time + (((d.date_idx + LENGTH(a.staff_email)) % 11) * INTERVAL '1 minute'),
    a.start_time + (((d.date_idx + LENGTH(a.staff_email)) % 7) * INTERVAL '1 minute'),
    a.end_time + (((d.date_idx + LENGTH(a.staff_email)) % 11) * INTERVAL '1 minute'),
    CASE WHEN ((d.date_idx + LENGTH(a.staff_email)) % 13) = 0 THEN 30 ELSE 0 END,
    'Seed ca làm demo cho dữ liệu bán hàng 2026-2027',
    (SELECT u.id FROM users u CROSS JOIN seed_constants sc WHERE u.tenant_id = sc.tenant_id AND u.email = 'hoang2312004@gmail.com' LIMIT 1),
    d.work_date + TIME '06:00'
FROM seed_shift_assignments a
CROSS JOIN seed_dates d
CROSS JOIN seed_constants c
ON CONFLICT (user_id, shift_template_id, date) DO UPDATE
SET
    status = EXCLUDED.status,
    checked_in_at = EXCLUDED.checked_in_at,
    checked_out_at = EXCLUDED.checked_out_at,
    actual_start_time = EXCLUDED.actual_start_time,
    actual_end_time = EXCLUDED.actual_end_time,
    overtime_minutes = EXCLUDED.overtime_minutes,
    note = EXCLUDED.note;

-- Tổng hợp chấm công và bảng lương demo từ lịch ca đã seed.
INSERT INTO monthly_attendance_summary (
    id, tenant_id, branch_id, staff_id, year_month, working_days,
    overtime_hours, absent_days, leave_days, violation_count, updated_at
)
SELECT
    uuid_generate_v5(c.namespace_id, 'attendance:' || ss.user_id || ':' || DATE_TRUNC('month', ss.date)::date),
    c.tenant_id,
    ss.branch_id,
    ss.user_id,
    DATE_TRUNC('month', ss.date)::date,
    COUNT(*)::int,
    ROUND((SUM(ss.overtime_minutes)::numeric / 60), 2),
    0,
    0,
    COUNT(*) FILTER (WHERE ss.checked_in_at::time > st.start_time + INTERVAL '5 minute')::int,
    NOW()
FROM shift_schedules ss
JOIN shift_templates st ON st.id = ss.shift_template_id
CROSS JOIN seed_constants c
WHERE ss.tenant_id = c.tenant_id
  AND ss.date BETWEEN c.start_date AND c.end_date
  AND ss.id = uuid_generate_v5(c.namespace_id, 'shift-schedule:' || ss.user_id || ':' || ss.shift_template_id || ':' || ss.date)
GROUP BY c.namespace_id, c.tenant_id, ss.branch_id, ss.user_id, DATE_TRUNC('month', ss.date)::date
ON CONFLICT (staff_id, year_month) DO UPDATE
SET
    working_days = EXCLUDED.working_days,
    overtime_hours = EXCLUDED.overtime_hours,
    violation_count = EXCLUDED.violation_count,
    updated_at = EXCLUDED.updated_at;

INSERT INTO payroll_entries (
    id, tenant_id, branch_id, staff_id, year_month, base_salary,
    working_days, overtime_hours, overtime_pay, total_bonuses,
    total_deductions, gross_salary, status, submitted_at, approved_at,
    paid_at, payment_method, payment_reference, notes, created_at, updated_at
)
SELECT
    uuid_generate_v5(c.namespace_id, 'payroll:' || mas.staff_id || ':' || mas.year_month),
    c.tenant_id,
    mas.branch_id,
    mas.staff_id,
    mas.year_month,
    CASE p.name
        WHEN 'Quản lý' THEN 12000000
        WHEN 'Pha chế' THEN 8500000
        ELSE 7500000
    END,
    mas.working_days,
    mas.overtime_hours,
    ROUND(mas.overtime_hours * 45000, 2),
    CASE WHEN mas.violation_count = 0 THEN 300000 ELSE 0 END,
    mas.violation_count * 50000,
    GREATEST(
        0,
        ROUND(
            (CASE p.name WHEN 'Quản lý' THEN 12000000 WHEN 'Pha chế' THEN 8500000 ELSE 7500000 END)
            * LEAST(mas.working_days, 26)::numeric / 26
            + mas.overtime_hours * 45000
            + CASE WHEN mas.violation_count = 0 THEN 300000 ELSE 0 END
            - mas.violation_count * 50000,
            2
        )
    ),
    'PAID',
    mas.year_month + INTERVAL '25 days',
    mas.year_month + INTERVAL '26 days',
    mas.year_month + INTERVAL '28 days',
    'BANK_TRANSFER',
    'SEEDPAYROLL-' || TO_CHAR(mas.year_month, 'YYYYMM') || '-' || RIGHT(mas.staff_id::text, 6),
    'Seed bảng lương demo theo lịch ca 2026-2027',
    mas.year_month + INTERVAL '25 days',
    NOW()
FROM monthly_attendance_summary mas
JOIN users u ON u.id = mas.staff_id
LEFT JOIN positions p ON p.id = u.position_id
CROSS JOIN seed_constants c
WHERE mas.tenant_id = c.tenant_id
  AND mas.year_month BETWEEN DATE_TRUNC('month', c.start_date)::date AND DATE_TRUNC('month', c.end_date)::date
  AND u.email LIKE 'seed.%@smartfnb.local'
ON CONFLICT (staff_id, year_month) DO UPDATE
SET
    branch_id = EXCLUDED.branch_id,
    working_days = EXCLUDED.working_days,
    overtime_hours = EXCLUDED.overtime_hours,
    overtime_pay = EXCLUDED.overtime_pay,
    total_bonuses = EXCLUDED.total_bonuses,
    total_deductions = EXCLUDED.total_deductions,
    gross_salary = EXCLUDED.gross_salary,
    status = EXCLUDED.status,
    paid_at = EXCLUDED.paid_at,
    payment_reference = EXCLUDED.payment_reference,
    notes = EXCLUDED.notes,
    updated_at = EXCLUDED.updated_at;

-- Mỗi chi nhánh một POS session/ngày, đóng cuối ngày để nối đơn hàng và payment.
WITH pos_source AS (
    SELECT
        d.work_date,
        b.id AS branch_id,
        b.name AS branch_name,
        CASE b.name
            WHEN 'SKT T1' THEN 'seed.skt.cashier@smartfnb.local'
            ELSE 'seed.geng.cashier@smartfnb.local'
        END AS cashier_email
    FROM seed_dates d
    CROSS JOIN seed_constants c
    JOIN branches b ON b.tenant_id = c.tenant_id AND b.status = 'ACTIVE' AND b.name IN ('SKT T1', 'GENG')
)
INSERT INTO pos_sessions (
    id, tenant_id, branch_id, opened_by_user_id, closed_by_user_id,
    start_time, end_time, starting_cash, ending_cash_expected,
    ending_cash_actual, status, note, cash_difference, cash_sales, cash_expenses
)
SELECT
    uuid_generate_v5(c.namespace_id, 'pos-session:' || ps.branch_id || ':' || ps.work_date),
    c.tenant_id,
    ps.branch_id,
    u.id,
    u.id,
    ps.work_date + TIME '06:55',
    ps.work_date + TIME '23:10',
    CASE ps.branch_name WHEN 'SKT T1' THEN 1500000 ELSE 1000000 END,
    CASE ps.branch_name WHEN 'SKT T1' THEN 1500000 ELSE 1000000 END,
    CASE ps.branch_name WHEN 'SKT T1' THEN 1500000 ELSE 1000000 END,
    'CLOSED',
    'Seed POS session demo cho bán hàng 2026-2027',
    0,
    0,
    0
FROM pos_source ps
CROSS JOIN seed_constants c
JOIN users u ON u.tenant_id = c.tenant_id AND u.email = ps.cashier_email
ON CONFLICT (id) DO UPDATE
SET
    opened_by_user_id = EXCLUDED.opened_by_user_id,
    closed_by_user_id = EXCLUDED.closed_by_user_id,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    starting_cash = EXCLUDED.starting_cash,
    status = EXCLUDED.status,
    note = EXCLUDED.note;

CREATE TEMP TABLE seed_branches ON COMMIT DROP AS
SELECT
    b.id AS branch_id,
    b.name AS branch_name,
    CASE b.name WHEN 'SKT T1' THEN 'SKT' ELSE 'GENG' END AS branch_short,
    CASE b.name WHEN 'SKT T1' THEN 38 ELSE 28 END AS base_orders,
    CASE b.name WHEN 'SKT T1' THEN 'seed.skt.cashier@smartfnb.local' ELSE 'seed.geng.cashier@smartfnb.local' END AS cashier_email
FROM branches b
CROSS JOIN seed_constants c
WHERE b.tenant_id = c.tenant_id
  AND b.status = 'ACTIVE'
  AND b.name IN ('SKT T1', 'GENG');

CREATE TEMP TABLE seed_branch_menu ON COMMIT DROP AS
SELECT
    m.*,
    ROW_NUMBER() OVER (PARTITION BY m.branch_id ORDER BY m.price DESC, m.item_name) AS rn,
    COUNT(*) OVER (PARTITION BY m.branch_id) AS menu_count
FROM (
    SELECT
        bi.branch_id,
        i.id AS item_id,
        i.name AS item_name,
        COALESCE(bi.branch_price, i.base_price) AS price
    FROM branch_items bi
    JOIN items i ON i.id = bi.item_id
    JOIN seed_branches sb ON sb.branch_id = bi.branch_id
    WHERE bi.is_available = TRUE
      AND i.type = 'SELLABLE'
      AND i.deleted_at IS NULL
      AND COALESCE(bi.branch_price, i.base_price) > 0
      AND EXISTS (SELECT 1 FROM recipes r WHERE r.target_item_id = i.id)
) m;

CREATE TEMP TABLE seed_order_base ON COMMIT DROP AS
SELECT
    uuid_generate_v5(c.namespace_id, 'order:' || sb.branch_id || ':' || d.work_date || ':' || LPAD(order_idx::text, 4, '0')) AS order_id,
    c.tenant_id,
    sb.branch_id,
    sb.branch_name,
    sb.branch_short,
    d.work_date AS order_date,
    d.date_idx,
    order_idx,
    'SEED-' || TO_CHAR(d.work_date, 'YYYYMMDD') || '-' || sb.branch_short || '-' || LPAD(order_idx::text, 4, '0') AS order_number,
    CASE WHEN ((order_idx + d.date_idx) % 20) IN (0, 1) THEN 'GRABFOOD' ELSE 'IN_STORE' END AS source,
    ps.id AS pos_session_id,
    u.id AS cashier_user_id,
    CASE
        WHEN ((order_idx + d.date_idx) % 10) < 5 THEN 'CASH'
        WHEN ((order_idx + d.date_idx) % 10) < 8 THEN 'VIETQR'
        WHEN ((order_idx + d.date_idx) % 10) = 8 THEN 'MOMO'
        ELSE 'PAYOS'
    END AS payment_method,
    (d.work_date + TIME '07:00') + (((order_idx * 37 + d.date_idx * 11) % 900) * INTERVAL '1 minute') AS created_at,
    tbl.table_id,
    0::numeric(12, 2) AS subtotal,
    0::numeric(12, 2) AS discount_amount,
    0::numeric(12, 2) AS tax_amount,
    0::numeric(12, 2) AS total_amount
FROM seed_dates d
CROSS JOIN seed_constants c
JOIN seed_branches sb ON TRUE
JOIN users u ON u.tenant_id = c.tenant_id AND u.email = sb.cashier_email
JOIN pos_sessions ps ON ps.id = uuid_generate_v5(c.namespace_id, 'pos-session:' || sb.branch_id || ':' || d.work_date)
CROSS JOIN LATERAL generate_series(
    1,
    sb.base_orders
      + CASE WHEN EXTRACT(DOW FROM d.work_date)::int IN (0, 6) THEN 9 ELSE 0 END
      + CASE WHEN EXTRACT(MONTH FROM d.work_date)::int IN (1, 6, 7, 12) THEN 5 ELSE 0 END
      + ((d.date_idx + LENGTH(sb.branch_short)) % 7)
) AS order_idx
LEFT JOIN LATERAL (
    SELECT q.id AS table_id
    FROM (
        SELECT
            t.id,
            ROW_NUMBER() OVER (ORDER BY t.name) AS rn,
            COUNT(*) OVER () AS cnt
        FROM tables t
        WHERE t.branch_id = sb.branch_id
          AND t.deleted_at IS NULL
          AND t.is_active = TRUE
    ) q
    WHERE q.rn = (((order_idx + d.date_idx) % q.cnt) + 1)
    LIMIT 1
) tbl ON TRUE;

-- Với các ngày đã có order thật, không sinh thêm order seed để tránh làm nhiễu dữ liệu hiện có.
DELETE FROM seed_order_base o
WHERE EXISTS (
    SELECT 1
    FROM orders existing_order
    WHERE existing_order.branch_id = o.branch_id
      AND existing_order.created_at::date = o.order_date
      AND existing_order.order_number NOT LIKE 'SEED-%'
);

CREATE TEMP TABLE seed_order_items ON COMMIT DROP AS
SELECT
    uuid_generate_v5(c.namespace_id, 'order-item:' || o.order_id || ':' || slot_idx) AS order_item_id,
    o.order_id,
    o.tenant_id,
    o.branch_id,
    o.order_date,
    o.created_at,
    slot_idx,
    menu.item_id,
    menu.item_name,
    CASE WHEN ((o.order_idx + o.date_idx + slot_idx) % 11) = 0 THEN 2 ELSE 1 END AS quantity,
    menu.price AS unit_price,
    (CASE WHEN ((o.order_idx + o.date_idx + slot_idx) % 11) = 0 THEN 2 ELSE 1 END * menu.price)::numeric(12, 2) AS total_price
FROM seed_order_base o
CROSS JOIN seed_constants c
CROSS JOIN LATERAL generate_series(
    1,
    CASE
        WHEN ((o.order_idx + o.date_idx) % 10) < 6 THEN 1
        WHEN ((o.order_idx + o.date_idx) % 10) < 9 THEN 2
        ELSE 3
    END
) AS slot_idx
JOIN LATERAL (
    SELECT bm.item_id, bm.item_name, bm.price
    FROM seed_branch_menu bm
    WHERE bm.branch_id = o.branch_id
      AND bm.rn = (((o.order_idx * (slot_idx + 2) + o.date_idx * 7 + slot_idx * 11) % bm.menu_count) + 1)
    LIMIT 1
) menu ON TRUE;

UPDATE seed_order_base o
SET
    subtotal = s.subtotal,
    discount_amount = CASE WHEN ((o.order_idx + o.date_idx) % 17) = 0 THEN ROUND(s.subtotal * 0.05, 2) ELSE 0 END,
    tax_amount = 0,
    total_amount = s.subtotal - CASE WHEN ((o.order_idx + o.date_idx) % 17) = 0 THEN ROUND(s.subtotal * 0.05, 2) ELSE 0 END
FROM (
    SELECT order_id, SUM(total_price)::numeric(12, 2) AS subtotal
    FROM seed_order_items
    GROUP BY order_id
) s
WHERE s.order_id = o.order_id;

INSERT INTO orders (
    id, tenant_id, branch_id, pos_session_id, user_id, table_id,
    order_number, source, status, subtotal, discount_amount,
    tax_amount, total_amount, notes, completed_at, created_at,
    created_by, updated_at, version
)
SELECT
    order_id,
    tenant_id,
    branch_id,
    pos_session_id,
    cashier_user_id,
    CASE WHEN source = 'IN_STORE' THEN table_id ELSE NULL END,
    order_number,
    source,
    'COMPLETED',
    subtotal,
    discount_amount,
    tax_amount,
    total_amount,
    'Seed đơn hàng demo từ dữ liệu món hiện có',
    created_at + INTERVAL '12 minutes',
    created_at,
    cashier_user_id,
    created_at + INTERVAL '12 minutes',
    0
FROM seed_order_base
ON CONFLICT (branch_id, order_number) DO UPDATE
SET
    pos_session_id = EXCLUDED.pos_session_id,
    user_id = EXCLUDED.user_id,
    table_id = EXCLUDED.table_id,
    source = EXCLUDED.source,
    status = EXCLUDED.status,
    subtotal = EXCLUDED.subtotal,
    discount_amount = EXCLUDED.discount_amount,
    tax_amount = EXCLUDED.tax_amount,
    total_amount = EXCLUDED.total_amount,
    completed_at = EXCLUDED.completed_at,
    updated_at = EXCLUDED.updated_at;

INSERT INTO order_items (
    id, order_id, item_id, item_name, quantity, unit_price,
    total_price, addons, notes, status
)
SELECT
    order_item_id,
    order_id,
    item_id,
    item_name,
    quantity,
    unit_price,
    total_price,
    '[]'::jsonb,
    NULL,
    'SERVED'
FROM seed_order_items
ON CONFLICT (id) DO UPDATE
SET
    item_id = EXCLUDED.item_id,
    item_name = EXCLUDED.item_name,
    quantity = EXCLUDED.quantity,
    unit_price = EXCLUDED.unit_price,
    total_price = EXCLUDED.total_price,
    status = EXCLUDED.status;

INSERT INTO order_status_logs (id, order_id, old_status, new_status, changed_by_user_id, reason, changed_at)
SELECT
    uuid_generate_v5(c.namespace_id, 'order-log-completed:' || o.order_id),
    o.order_id,
    'PENDING',
    'COMPLETED',
    o.cashier_user_id,
    'Seed hoàn tất đơn demo',
    o.created_at + INTERVAL '12 minutes'
FROM seed_order_base o
CROSS JOIN seed_constants c
ON CONFLICT (id) DO UPDATE
SET
    changed_by_user_id = EXCLUDED.changed_by_user_id,
    changed_at = EXCLUDED.changed_at;

INSERT INTO payments (
    id, tenant_id, order_id, amount, method, status, transaction_id,
    cashier_user_id, qr_expires_at, paid_at, created_at, version, pos_session_id
)
SELECT
    uuid_generate_v5(c.namespace_id, 'payment:' || o.order_id),
    o.tenant_id,
    o.order_id,
    o.total_amount,
    o.payment_method,
    'COMPLETED',
    'SEEDPAY-' || REPLACE(o.order_id::text, '-', ''),
    o.cashier_user_id,
    CASE WHEN o.payment_method <> 'CASH' THEN o.created_at + INTERVAL '3 minutes' ELSE NULL END,
    o.created_at + INTERVAL '13 minutes',
    o.created_at + INTERVAL '13 minutes',
    0,
    o.pos_session_id
FROM seed_order_base o
CROSS JOIN seed_constants c
ON CONFLICT (id) DO UPDATE
SET
    amount = EXCLUDED.amount,
    method = EXCLUDED.method,
    status = EXCLUDED.status,
    cashier_user_id = EXCLUDED.cashier_user_id,
    paid_at = EXCLUDED.paid_at,
    created_at = EXCLUDED.created_at,
    pos_session_id = EXCLUDED.pos_session_id;

INSERT INTO invoices (
    id, tenant_id, branch_id, order_id, payment_id, invoice_number,
    subtotal, discount, tax_amount, total, issued_at
)
SELECT
    uuid_generate_v5(c.namespace_id, 'invoice:' || o.order_id),
    o.tenant_id,
    o.branch_id,
    o.order_id,
    uuid_generate_v5(c.namespace_id, 'payment:' || o.order_id),
    'SEEDINV-' || TO_CHAR(o.order_date, 'YYYYMMDD') || '-' || o.branch_short || '-' || LPAD(o.order_idx::text, 4, '0'),
    o.subtotal,
    o.discount_amount,
    o.tax_amount,
    o.total_amount,
    o.created_at + INTERVAL '14 minutes'
FROM seed_order_base o
CROSS JOIN seed_constants c
ON CONFLICT (invoice_number) DO UPDATE
SET
    subtotal = EXCLUDED.subtotal,
    discount = EXCLUDED.discount,
    tax_amount = EXCLUDED.tax_amount,
    total = EXCLUDED.total,
    issued_at = EXCLUDED.issued_at;

INSERT INTO invoice_items (
    id, invoice_id, item_name, quantity, unit_price, total_price
)
SELECT
    uuid_generate_v5(c.namespace_id, 'invoice-item:' || oi.order_item_id),
    uuid_generate_v5(c.namespace_id, 'invoice:' || oi.order_id),
    oi.item_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price
FROM seed_order_items oi
CROSS JOIN seed_constants c
ON CONFLICT (id) DO UPDATE
SET
    item_name = EXCLUDED.item_name,
    quantity = EXCLUDED.quantity,
    unit_price = EXCLUDED.unit_price,
    total_price = EXCLUDED.total_price;

CREATE TEMP TABLE seed_inventory_usage ON COMMIT DROP AS
SELECT
    oi.tenant_id,
    oi.branch_id,
    r.ingredient_item_id AS item_id,
    SUM(oi.quantity * r.quantity)::numeric(14, 4) AS total_quantity
FROM seed_order_items oi
JOIN recipes r ON r.target_item_id = oi.item_id
GROUP BY oi.tenant_id, oi.branch_id, r.ingredient_item_id;

CREATE TEMP TABLE seed_inventory_costs ON COMMIT DROP AS
SELECT
    u.tenant_id,
    u.branch_id,
    u.item_id,
    i.name AS item_name,
    i.unit,
    u.total_quantity,
    COALESCE(
        NULLIF(AVG(sb.cost_per_unit) FILTER (WHERE sb.cost_per_unit > 0), 0),
        CASE i.unit
            WHEN 'cái' THEN 3500
            WHEN 'quả' THEN 2500
            WHEN 'g' THEN 0.12
            WHEN 'ml' THEN 0.08
            ELSE 100
        END
    )::numeric(12, 4) AS cost_per_unit
FROM seed_inventory_usage u
JOIN items i ON i.id = u.item_id
LEFT JOIN stock_batches sb ON sb.branch_id = u.branch_id AND sb.item_id = u.item_id AND sb.cost_per_unit > 0
GROUP BY u.tenant_id, u.branch_id, u.item_id, i.name, i.unit, u.total_quantity;

INSERT INTO stock_batches (
    id, tenant_id, branch_id, item_id, supplier_id, quantity_initial,
    quantity_remaining, cost_per_unit, imported_at, expires_at, created_at, updated_at
)
SELECT
    uuid_generate_v5(c.namespace_id, 'stock-reserve:' || ic.branch_id || ':' || ic.item_id),
    ic.tenant_id,
    ic.branch_id,
    ic.item_id,
    NULL,
    LEAST(900000::numeric, ROUND(ic.total_quantity * 1.05 + 50000, 4)),
    LEAST(850000::numeric, ROUND(ic.total_quantity * 0.05 + 50000, 4)),
    ic.cost_per_unit,
    c.start_date - INTERVAL '1 day',
    c.end_date + INTERVAL '90 days',
    c.start_date - INTERVAL '1 day',
    NOW()
FROM seed_inventory_costs ic
CROSS JOIN seed_constants c
ON CONFLICT (id) DO UPDATE
SET
    quantity_initial = EXCLUDED.quantity_initial,
    quantity_remaining = EXCLUDED.quantity_remaining,
    cost_per_unit = EXCLUDED.cost_per_unit,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();

INSERT INTO inventory_balances (
    id, tenant_id, branch_id, item_id, item_name, unit, quantity, min_level, version, updated_at
)
SELECT
    uuid_generate_v5(c.namespace_id, 'inventory-balance:' || ic.branch_id || ':' || ic.item_id),
    ic.tenant_id,
    ic.branch_id,
    ic.item_id,
    ic.item_name,
    ic.unit,
    LEAST(850000::numeric, ROUND(ic.total_quantity * 0.05 + 50000, 4)),
    CASE ic.unit
        WHEN 'cái' THEN 50
        WHEN 'quả' THEN 50
        WHEN 'g' THEN 800
        WHEN 'ml' THEN 1200
        ELSE 10
    END,
    0,
    NOW()
FROM seed_inventory_costs ic
CROSS JOIN seed_constants c
ON CONFLICT (branch_id, item_id) DO UPDATE
SET
    item_name = EXCLUDED.item_name,
    unit = EXCLUDED.unit,
    quantity = GREATEST(inventory_balances.quantity, EXCLUDED.quantity),
    min_level = GREATEST(inventory_balances.min_level, EXCLUDED.min_level),
    updated_at = NOW();

INSERT INTO inventory_transactions (
    id, tenant_id, branch_id, item_id, user_id, batch_id, type,
    quantity, cost_per_unit, reference_id, reference_type, note, created_at
)
SELECT
    uuid_generate_v5(c.namespace_id, 'inventory-import:' || ic.branch_id || ':' || ic.item_id),
    ic.tenant_id,
    ic.branch_id,
    ic.item_id,
    (SELECT u.id FROM users u WHERE u.tenant_id = ic.tenant_id AND u.email LIKE 'seed.%manager@smartfnb.local' ORDER BY u.email LIMIT 1),
    uuid_generate_v5(c.namespace_id, 'stock-reserve:' || ic.branch_id || ':' || ic.item_id),
    'IMPORT',
    LEAST(900000::numeric, ROUND(ic.total_quantity * 1.05 + 50000, 4)),
    ic.cost_per_unit,
    uuid_generate_v5(c.namespace_id, 'stock-reserve:' || ic.branch_id || ':' || ic.item_id),
    'MANUAL',
    'Seed nhập kho dự phòng cho dữ liệu bán hàng 2026-2027',
    c.start_date - INTERVAL '1 day'
FROM seed_inventory_costs ic
CROSS JOIN seed_constants c
ON CONFLICT (id) DO UPDATE
SET
    quantity = EXCLUDED.quantity,
    cost_per_unit = EXCLUDED.cost_per_unit,
    note = EXCLUDED.note,
    created_at = EXCLUDED.created_at;

CREATE TEMP TABLE seed_order_item_costs ON COMMIT DROP AS
SELECT
    oi.order_item_id,
    oi.order_id,
    oi.tenant_id,
    oi.branch_id,
    oi.order_date,
    oi.item_id AS sellable_item_id,
    oi.item_name AS sellable_item_name,
    SUM(oi.quantity * r.quantity * ic.cost_per_unit)::numeric(12, 2) AS ingredient_cost
FROM seed_order_items oi
JOIN recipes r ON r.target_item_id = oi.item_id
JOIN seed_inventory_costs ic ON ic.branch_id = oi.branch_id AND ic.item_id = r.ingredient_item_id
GROUP BY oi.order_item_id, oi.order_id, oi.tenant_id, oi.branch_id, oi.order_date, oi.item_id, oi.item_name;

INSERT INTO inventory_transactions (
    id, tenant_id, branch_id, item_id, user_id, batch_id, type,
    quantity, cost_per_unit, reference_id, reference_type, note, created_at
)
SELECT
    uuid_generate_v5(c.namespace_id, 'sale-deduct:' || oi.order_item_id || ':' || r.ingredient_item_id),
    oi.tenant_id,
    oi.branch_id,
    r.ingredient_item_id,
    ob.cashier_user_id,
    uuid_generate_v5(c.namespace_id, 'stock-reserve:' || oi.branch_id || ':' || r.ingredient_item_id),
    'SALE_DEDUCT',
    -(oi.quantity * r.quantity)::numeric(10, 4),
    ic.cost_per_unit,
    oi.order_id,
    'ORDER',
    'Seed trừ kho theo công thức món bán 2026-2027',
    oi.created_at + INTERVAL '12 minutes'
FROM seed_order_items oi
JOIN seed_order_base ob ON ob.order_id = oi.order_id
JOIN recipes r ON r.target_item_id = oi.item_id
JOIN seed_inventory_costs ic ON ic.branch_id = oi.branch_id AND ic.item_id = r.ingredient_item_id
CROSS JOIN seed_constants c
ON CONFLICT (id) DO UPDATE
SET
    quantity = EXCLUDED.quantity,
    cost_per_unit = EXCLUDED.cost_per_unit,
    reference_id = EXCLUDED.reference_id,
    note = EXCLUDED.note,
    created_at = EXCLUDED.created_at;

CREATE TEMP TABLE seed_daily_cogs ON COMMIT DROP AS
SELECT
    tenant_id,
    branch_id,
    order_date,
    SUM(ingredient_cost)::numeric(12, 2) AS cost_of_goods
FROM seed_order_item_costs
GROUP BY tenant_id, branch_id, order_date;

INSERT INTO daily_revenue_summaries (
    id, tenant_id, branch_id, date, total_revenue, total_orders,
    avg_order_value, payment_breakdown, cost_of_goods, updated_at
)
SELECT
    uuid_generate_v5(c.namespace_id, 'daily-revenue:' || o.branch_id || ':' || o.order_date),
    o.tenant_id,
    o.branch_id,
    o.order_date,
    SUM(o.total_amount)::numeric(12, 2),
    COUNT(*)::int,
    ROUND(SUM(o.total_amount) / COUNT(*), 2),
    jsonb_build_object(
        'cash',    COALESCE(SUM(o.total_amount) FILTER (WHERE o.payment_method = 'CASH'), 0),
        'momo',    COALESCE(SUM(o.total_amount) FILTER (WHERE o.payment_method = 'MOMO'), 0),
        'vietqr',  COALESCE(SUM(o.total_amount) FILTER (WHERE o.payment_method = 'VIETQR'), 0),
        'banking', 0,
        'other',   0,
        'payos',   COALESCE(SUM(o.total_amount) FILTER (WHERE o.payment_method = 'PAYOS'), 0)
    ),
    COALESCE(dc.cost_of_goods, 0),
    NOW()
FROM seed_order_base o
LEFT JOIN seed_daily_cogs dc ON dc.branch_id = o.branch_id AND dc.order_date = o.order_date
CROSS JOIN seed_constants c
GROUP BY c.namespace_id, o.tenant_id, o.branch_id, o.order_date, dc.cost_of_goods
ON CONFLICT (branch_id, date) DO UPDATE
SET
    total_revenue = EXCLUDED.total_revenue,
    total_orders = EXCLUDED.total_orders,
    avg_order_value = EXCLUDED.avg_order_value,
    payment_breakdown = EXCLUDED.payment_breakdown,
    cost_of_goods = EXCLUDED.cost_of_goods,
    updated_at = NOW();

INSERT INTO hourly_revenue_stats (
    id, branch_id, date, hour, order_count, revenue
)
WITH hourly AS (
    SELECT
        o.branch_id,
        o.order_date,
        EXTRACT(HOUR FROM o.created_at)::smallint AS order_hour,
        COUNT(*)::int AS order_count,
        SUM(o.total_amount)::numeric(12, 2) AS revenue
    FROM seed_order_base o
    GROUP BY o.branch_id, o.order_date, EXTRACT(HOUR FROM o.created_at)::smallint
)
SELECT
    uuid_generate_v5(c.namespace_id, 'hourly-revenue:' || h.branch_id || ':' || h.order_date || ':' || h.order_hour),
    h.branch_id,
    h.order_date,
    h.order_hour,
    h.order_count,
    h.revenue
FROM hourly h
CROSS JOIN seed_constants c
ON CONFLICT (branch_id, date, hour) DO UPDATE
SET
    order_count = EXCLUDED.order_count,
    revenue = EXCLUDED.revenue;

INSERT INTO daily_item_stats (
    id, tenant_id, branch_id, item_id, item_name, date,
    qty_sold, revenue, cost
)
SELECT
    uuid_generate_v5(c.namespace_id, 'daily-item:' || oi.branch_id || ':' || oi.item_id || ':' || oi.order_date),
    oi.tenant_id,
    oi.branch_id,
    oi.item_id,
    oi.item_name,
    oi.order_date,
    SUM(oi.quantity)::int,
    SUM(oi.total_price)::numeric(12, 2),
    COALESCE(SUM(oic.ingredient_cost), 0)::numeric(12, 2)
FROM seed_order_items oi
LEFT JOIN seed_order_item_costs oic ON oic.order_item_id = oi.order_item_id
CROSS JOIN seed_constants c
GROUP BY c.namespace_id, oi.tenant_id, oi.branch_id, oi.item_id, oi.item_name, oi.order_date
ON CONFLICT (branch_id, item_id, date) DO UPDATE
SET
    item_name = EXCLUDED.item_name,
    qty_sold = EXCLUDED.qty_sold,
    revenue = EXCLUDED.revenue,
    cost = EXCLUDED.cost;

-- Cập nhật số tiền đóng ca theo payment đã seed.
WITH session_cash AS (
    SELECT
        o.pos_session_id,
        SUM(o.total_amount) FILTER (WHERE o.payment_method = 'CASH') AS cash_sales
    FROM seed_order_base o
    GROUP BY o.pos_session_id
)
UPDATE pos_sessions ps
SET
    cash_sales = COALESCE(sc.cash_sales, 0),
    cash_expenses = 0,
    ending_cash_expected = ps.starting_cash + COALESCE(sc.cash_sales, 0),
    ending_cash_actual = ps.starting_cash + COALESCE(sc.cash_sales, 0)
        + CASE
            WHEN (EXTRACT(DOY FROM ps.start_time)::int % 29) = 0 THEN -20000
            WHEN (EXTRACT(DOY FROM ps.start_time)::int % 31) = 0 THEN 10000
            ELSE 0
          END,
    cash_difference = CASE
        WHEN (EXTRACT(DOY FROM ps.start_time)::int % 29) = 0 THEN -20000
        WHEN (EXTRACT(DOY FROM ps.start_time)::int % 31) = 0 THEN 10000
        ELSE 0
    END,
    status = 'CLOSED'
FROM session_cash sc
WHERE ps.id = sc.pos_session_id;

COMMIT;

-- Kiểm tra nhanh sau seed.
SELECT 'seed_orders' AS metric, COUNT(*) AS value
FROM orders
WHERE order_number LIKE 'SEED-%'
UNION ALL
SELECT 'seed_payments', COUNT(*)
FROM payments p
JOIN orders o ON o.id = p.order_id
WHERE o.order_number LIKE 'SEED-%'
UNION ALL
SELECT 'seed_invoices', COUNT(*)
FROM invoices
WHERE invoice_number LIKE 'SEEDINV-%'
UNION ALL
SELECT 'seed_inventory_transactions', COUNT(*)
FROM inventory_transactions
WHERE note LIKE 'Seed%2026-2027'
UNION ALL
SELECT 'seed_shift_schedules', COUNT(*)
FROM shift_schedules ss
WHERE ss.id = uuid_generate_v5('00000000-0000-0000-0000-000000000517'::uuid, 'shift-schedule:' || ss.user_id || ':' || ss.shift_template_id || ':' || ss.date);
