-- Cleanup dữ liệu seed bán hàng demo.
-- Mặc định chỉ preview số lượng sẽ xoá. Muốn xoá thật, chạy với: -v confirm_delete=true

\set ON_ERROR_STOP on

\if :{?confirm_delete}
\else
\set confirm_delete false
\endif

\if :{?start_date}
\else
\set start_date '2026-05-17'
\endif

\if :{?end_date}
\else
\set end_date '2027-05-17'
\endif

CREATE TEMP TABLE cleanup_constants AS
SELECT
    '6bb03956-2821-415f-8bbf-43e3e87cba83'::uuid AS tenant_id,
    '00000000-0000-0000-0000-000000000517'::uuid AS namespace_id,
    :'start_date'::date AS start_date,
    :'end_date'::date AS end_date;

CREATE TEMP TABLE cleanup_orders AS
SELECT o.id
FROM orders o
CROSS JOIN cleanup_constants c
WHERE o.tenant_id = c.tenant_id
  AND o.order_number LIKE 'SEED-%'
  AND o.created_at::date BETWEEN c.start_date AND c.end_date;

CREATE TEMP TABLE cleanup_invoices AS
SELECT i.id
FROM invoices i
CROSS JOIN cleanup_constants c
WHERE i.tenant_id = c.tenant_id
  AND i.invoice_number LIKE 'SEEDINV-%'
  AND i.issued_at::date BETWEEN c.start_date AND c.end_date;

CREATE TEMP TABLE cleanup_payments AS
SELECT p.id
FROM payments p
JOIN cleanup_orders o ON o.id = p.order_id;

CREATE TEMP TABLE cleanup_pos_sessions AS
SELECT ps.id
FROM pos_sessions ps
CROSS JOIN cleanup_constants c
WHERE ps.tenant_id = c.tenant_id
  AND ps.note = 'Seed POS session demo cho bán hàng 2026-2027'
  AND ps.start_time::date BETWEEN c.start_date AND c.end_date;

CREATE TEMP TABLE cleanup_shift_schedules AS
SELECT ss.id, ss.user_id, ss.date
FROM shift_schedules ss
CROSS JOIN cleanup_constants c
WHERE ss.tenant_id = c.tenant_id
  AND ss.note = 'Seed ca làm demo cho dữ liệu bán hàng 2026-2027'
  AND ss.date BETWEEN c.start_date AND c.end_date;

CREATE TEMP TABLE cleanup_seed_staff AS
SELECT u.id
FROM users u
CROSS JOIN cleanup_constants c
WHERE u.tenant_id = c.tenant_id
  AND u.email LIKE 'seed.%@smartfnb.local';

CREATE TEMP TABLE cleanup_inventory_transactions AS
SELECT it.id
FROM inventory_transactions it
CROSS JOIN cleanup_constants c
WHERE it.tenant_id = c.tenant_id
  AND it.note = 'Seed trừ kho theo công thức món bán 2026-2027'
  AND it.created_at::date BETWEEN c.start_date AND c.end_date;

CREATE TEMP TABLE cleanup_seed_import_transactions AS
SELECT it.id
FROM inventory_transactions it
CROSS JOIN cleanup_constants c
WHERE it.tenant_id = c.tenant_id
  AND it.note = 'Seed nhập kho dự phòng cho dữ liệu bán hàng 2026-2027';

CREATE TEMP TABLE cleanup_daily_item_stats AS
SELECT dis.id
FROM daily_item_stats dis
CROSS JOIN cleanup_constants c
WHERE dis.date BETWEEN c.start_date AND c.end_date
  AND dis.id = uuid_generate_v5(
      c.namespace_id,
      'daily-item:' || dis.branch_id || ':' || dis.item_id || ':' || dis.date
  );

CREATE TEMP TABLE cleanup_hourly_revenue_stats AS
SELECT hrs.id
FROM hourly_revenue_stats hrs
CROSS JOIN cleanup_constants c
WHERE hrs.date BETWEEN c.start_date AND c.end_date
  AND hrs.id = uuid_generate_v5(
      c.namespace_id,
      'hourly-revenue:' || hrs.branch_id || ':' || hrs.date || ':' || hrs.hour
  );

CREATE TEMP TABLE cleanup_daily_revenue_summaries AS
SELECT dr.id
FROM daily_revenue_summaries dr
CROSS JOIN cleanup_constants c
WHERE dr.date BETWEEN c.start_date AND c.end_date
  AND dr.id = uuid_generate_v5(
      c.namespace_id,
      'daily-revenue:' || dr.branch_id || ':' || dr.date
  );

CREATE TEMP TABLE cleanup_payroll_entries AS
SELECT pe.id
FROM payroll_entries pe
JOIN cleanup_seed_staff css ON css.id = pe.staff_id
CROSS JOIN cleanup_constants c
WHERE pe.notes = 'Seed bảng lương demo theo lịch ca 2026-2027'
  AND pe.year_month BETWEEN DATE_TRUNC('month', c.start_date)::date
                        AND DATE_TRUNC('month', c.end_date)::date;

CREATE TEMP TABLE cleanup_monthly_attendance AS
SELECT mas.id
FROM monthly_attendance_summary mas
JOIN cleanup_seed_staff css ON css.id = mas.staff_id
CROSS JOIN cleanup_constants c
WHERE mas.year_month BETWEEN DATE_TRUNC('month', c.start_date)::date
                         AND DATE_TRUNC('month', c.end_date)::date;

CREATE TEMP TABLE cleanup_stock_batches AS
SELECT sb.id
FROM stock_batches sb
CROSS JOIN cleanup_constants c
WHERE sb.tenant_id = c.tenant_id
  AND sb.id = uuid_generate_v5(c.namespace_id, 'stock-reserve:' || sb.branch_id || ':' || sb.item_id)
  AND NOT EXISTS (
      SELECT 1
      FROM inventory_transactions it
      WHERE it.batch_id = sb.id
        AND it.id NOT IN (SELECT id FROM cleanup_inventory_transactions)
        AND it.id NOT IN (SELECT id FROM cleanup_seed_import_transactions)
  );

CREATE TEMP TABLE cleanup_deletable_staff AS
SELECT css.id
FROM cleanup_seed_staff css
WHERE NOT EXISTS (
      SELECT 1 FROM orders o
      WHERE (o.user_id = css.id OR o.created_by = css.id)
        AND o.id NOT IN (SELECT id FROM cleanup_orders)
  )
  AND NOT EXISTS (
      SELECT 1 FROM payments p
      WHERE p.cashier_user_id = css.id
        AND p.id NOT IN (SELECT id FROM cleanup_payments)
  )
  AND NOT EXISTS (
      SELECT 1 FROM pos_sessions ps
      WHERE (ps.opened_by_user_id = css.id OR ps.closed_by_user_id = css.id)
        AND ps.id NOT IN (SELECT id FROM cleanup_pos_sessions)
  )
  AND NOT EXISTS (
      SELECT 1 FROM shift_schedules ss
      WHERE (ss.user_id = css.id OR ss.registered_by = css.id)
        AND ss.id NOT IN (SELECT id FROM cleanup_shift_schedules)
  )
  AND NOT EXISTS (
      SELECT 1 FROM payroll_entries pe
      WHERE pe.staff_id = css.id
        AND pe.id NOT IN (SELECT id FROM cleanup_payroll_entries)
  )
  AND NOT EXISTS (
      SELECT 1 FROM monthly_attendance_summary mas
      WHERE mas.staff_id = css.id
        AND mas.id NOT IN (SELECT id FROM cleanup_monthly_attendance)
  )
  AND NOT EXISTS (
      SELECT 1 FROM inventory_transactions it
      WHERE it.user_id = css.id
        AND it.id NOT IN (SELECT id FROM cleanup_inventory_transactions)
        AND it.id NOT IN (SELECT id FROM cleanup_seed_import_transactions)
  );

\echo 'Preview dữ liệu seed sẽ xoá'
SELECT 'order_items' AS target, COUNT(*) AS rows
FROM order_items oi JOIN cleanup_orders o ON o.id = oi.order_id
UNION ALL SELECT 'order_status_logs', COUNT(*) FROM order_status_logs osl JOIN cleanup_orders o ON o.id = osl.order_id
UNION ALL SELECT 'payments', COUNT(*) FROM cleanup_payments
UNION ALL SELECT 'invoice_items', COUNT(*) FROM invoice_items ii JOIN cleanup_invoices i ON i.id = ii.invoice_id
UNION ALL SELECT 'invoices', COUNT(*) FROM cleanup_invoices
UNION ALL SELECT 'orders', COUNT(*) FROM cleanup_orders
UNION ALL SELECT 'inventory_sale_deduct', COUNT(*) FROM cleanup_inventory_transactions
UNION ALL SELECT 'daily_item_stats', COUNT(*) FROM cleanup_daily_item_stats
UNION ALL SELECT 'hourly_revenue_stats', COUNT(*) FROM cleanup_hourly_revenue_stats
UNION ALL SELECT 'daily_revenue_summaries', COUNT(*) FROM cleanup_daily_revenue_summaries
UNION ALL SELECT 'pos_sessions', COUNT(*) FROM cleanup_pos_sessions
UNION ALL SELECT 'shift_schedules', COUNT(*) FROM cleanup_shift_schedules
UNION ALL SELECT 'payroll_entries', COUNT(*) FROM cleanup_payroll_entries
UNION ALL SELECT 'monthly_attendance_summary', COUNT(*) FROM cleanup_monthly_attendance
UNION ALL
SELECT 'seed_import_transactions_deletable', COUNT(*)
FROM cleanup_seed_import_transactions csit
JOIN cleanup_stock_batches csb ON csb.id = (
    SELECT it.batch_id FROM inventory_transactions it WHERE it.id = csit.id
)
UNION ALL SELECT 'stock_batches_deletable', COUNT(*) FROM cleanup_stock_batches
UNION ALL SELECT 'seed_staff_deletable_after_cleanup', COUNT(*) FROM cleanup_deletable_staff
ORDER BY target;

\if :confirm_delete
\echo 'CONFIRMED: xoá dữ liệu seed theo preview ở trên'
BEGIN;

DELETE FROM invoice_items ii USING cleanup_invoices i WHERE ii.invoice_id = i.id;
DELETE FROM invoices i USING cleanup_invoices ci WHERE i.id = ci.id;

DELETE FROM payments p USING cleanup_payments cp WHERE p.id = cp.id;
DELETE FROM order_status_logs osl USING cleanup_orders co WHERE osl.order_id = co.id;
DELETE FROM order_items oi USING cleanup_orders co WHERE oi.order_id = co.id;
DELETE FROM orders o USING cleanup_orders co WHERE o.id = co.id;

DELETE FROM inventory_transactions it USING cleanup_inventory_transactions cit WHERE it.id = cit.id;

DELETE FROM daily_item_stats dis USING cleanup_daily_item_stats cdis WHERE dis.id = cdis.id;
DELETE FROM hourly_revenue_stats hrs USING cleanup_hourly_revenue_stats chrs WHERE hrs.id = chrs.id;
DELETE FROM daily_revenue_summaries dr USING cleanup_daily_revenue_summaries cdr WHERE dr.id = cdr.id;

DELETE FROM pos_sessions ps USING cleanup_pos_sessions cps WHERE ps.id = cps.id;

DELETE FROM payroll_entries pe USING cleanup_payroll_entries cpe WHERE pe.id = cpe.id;
DELETE FROM monthly_attendance_summary mas USING cleanup_monthly_attendance cma WHERE mas.id = cma.id;
DELETE FROM shift_schedules ss USING cleanup_shift_schedules css WHERE ss.id = css.id;

DELETE FROM inventory_transactions it
USING cleanup_seed_import_transactions csit
WHERE it.id = csit.id
  AND EXISTS (SELECT 1 FROM cleanup_stock_batches csb WHERE csb.id = it.batch_id);

DELETE FROM stock_batches sb USING cleanup_stock_batches csb WHERE sb.id = csb.id;

DELETE FROM user_roles ur USING cleanup_deletable_staff cds WHERE ur.user_id = cds.id;
DELETE FROM branch_users bu USING cleanup_deletable_staff cds WHERE bu.user_id = cds.id;
DELETE FROM users u USING cleanup_deletable_staff cds WHERE u.id = cds.id;

COMMIT;

\echo 'Kiểm tra còn lại sau cleanup'
SELECT 'seed_orders_in_range' AS metric, COUNT(*) AS rows
FROM orders o CROSS JOIN cleanup_constants c
WHERE o.order_number LIKE 'SEED-%'
  AND o.created_at::date BETWEEN c.start_date AND c.end_date
UNION ALL
SELECT 'seed_invoices_in_range', COUNT(*)
FROM invoices i CROSS JOIN cleanup_constants c
WHERE i.invoice_number LIKE 'SEEDINV-%'
  AND i.issued_at::date BETWEEN c.start_date AND c.end_date
UNION ALL
SELECT 'seed_sale_deduct_in_range', COUNT(*)
FROM inventory_transactions it CROSS JOIN cleanup_constants c
WHERE it.note = 'Seed trừ kho theo công thức món bán 2026-2027'
  AND it.created_at::date BETWEEN c.start_date AND c.end_date
UNION ALL
SELECT 'seed_pos_sessions_in_range', COUNT(*)
FROM pos_sessions ps CROSS JOIN cleanup_constants c
WHERE ps.note = 'Seed POS session demo cho bán hàng 2026-2027'
  AND ps.start_time::date BETWEEN c.start_date AND c.end_date
UNION ALL
SELECT 'seed_shifts_in_range', COUNT(*)
FROM shift_schedules ss CROSS JOIN cleanup_constants c
WHERE ss.note = 'Seed ca làm demo cho dữ liệu bán hàng 2026-2027'
  AND ss.date BETWEEN c.start_date AND c.end_date;
\else
\echo 'Preview only. Muốn xoá thật, chạy lại với -v confirm_delete=true'
\endif
