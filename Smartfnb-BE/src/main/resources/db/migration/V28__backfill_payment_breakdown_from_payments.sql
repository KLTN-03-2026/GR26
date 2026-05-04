-- V28: Backfill payment_breakdown trong daily_revenue_summaries từ bảng payments thực tế.
-- Nguyên nhân:
--   1. ProcessCashPaymentCommandHandler trước đây không publish PaymentCompletedEvent
--      → payment_breakdown.cash luôn = 0 với các đơn cũ
--   2. V27 đã coerce null → 0 nhưng không restore được số tiền thực
-- Giải pháp: tính lại từ payments JOIN orders (pattern giống aggregateByMethodForBranchAndDate)
-- Điều kiện lọc: p.status = 'COMPLETED' để không tính đơn chưa thanh toán hoặc đã hoàn

WITH payment_agg AS (
    SELECT
        o.branch_id,
        CAST(p.paid_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh' AS date) AS payment_date,
        COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'CASH'),    0) AS cash_total,
        COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'MOMO'),    0) AS momo_total,
        COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'VIETQR'),  0) AS vietqr_total,
        COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'BANKING'), 0) AS banking_total,
        COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'OTHER'),   0) AS other_total,
        COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'PAYOS'),   0) AS payos_total
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    WHERE p.status = 'COMPLETED'
      AND p.paid_at IS NOT NULL
    GROUP BY o.branch_id,
             CAST(p.paid_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh' AS date)
)
UPDATE daily_revenue_summaries d
SET payment_breakdown = jsonb_build_object(
    'cash',    pa.cash_total,
    'momo',    pa.momo_total,
    'vietqr',  pa.vietqr_total,
    'banking', pa.banking_total,
    'other',   pa.other_total,
    'payos',   pa.payos_total
)
FROM payment_agg pa
WHERE d.branch_id = pa.branch_id
  AND d.date = pa.payment_date;
