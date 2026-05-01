-- V27: Backfill payment_breakdown JSONB — coerce null fields → 0
-- Nguyên nhân: field 'payos' được thêm vào sau (V25), các bản ghi cũ không có key này
-- → Jackson deserialize → null → NPE tại DailyRevenueSummary.PaymentBreakdown.total()
--   và GetPaymentMethodBreakdownQueryHandler.buildPaymentMethodDto()
-- Tác động: tất cả rows trong daily_revenue_summaries có payment_breakdown IS NOT NULL

UPDATE daily_revenue_summaries
SET payment_breakdown = jsonb_build_object(
    'cash',    COALESCE((payment_breakdown->>'cash')::numeric,    0),
    'momo',    COALESCE((payment_breakdown->>'momo')::numeric,    0),
    'vietqr',  COALESCE((payment_breakdown->>'vietqr')::numeric,  0),
    'banking', COALESCE((payment_breakdown->>'banking')::numeric, 0),
    'other',   COALESCE((payment_breakdown->>'other')::numeric,   0),
    'payos',   COALESCE((payment_breakdown->>'payos')::numeric,   0)
)
WHERE payment_breakdown IS NOT NULL;
