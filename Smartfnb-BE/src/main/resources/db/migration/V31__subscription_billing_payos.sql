-- author: Hoàng | date: 2026-05-16 | note: Tạo bảng subscription_payment_attempts
--   để lưu các lần thử thanh toán gói dịch vụ qua PayOS (và mở rộng cho VIETQR/MOMO sau này).
--   Lý do tách bảng riêng thay vì thêm cột vào subscription_invoices:
--   - Một invoice có thể có nhiều lần tạo QR (user tạo lại nhiều lần).
--   - Webhook từ link PayOS cũ vẫn cần xử lý idempotent và tra cứu đúng attempt.
--   - Không làm bẩn bảng invoice với dữ liệu payment-attempt.

CREATE TABLE IF NOT EXISTS subscription_payment_attempts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id          UUID NOT NULL REFERENCES subscription_invoices(id) ON DELETE CASCADE,
    tenant_id           UUID NOT NULL,
    provider            VARCHAR(30)  NOT NULL,   -- PAYOS | VIETQR | MOMO
    amount              DECIMAL(12, 2) NOT NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',  -- PENDING | PAID | FAILED | EXPIRED | CANCELLED
    provider_reference  VARCHAR(100),  -- paymentLinkId của PayOS
    provider_order_code BIGINT,       -- orderCode của PayOS
    checkout_url        TEXT,         -- link PayOS mở trình duyệt
    qr_code             TEXT,         -- raw QR string từ PayOS SDK
    expires_at          TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index tìm attempt theo invoice (lấy attempt mới nhất của một invoice)
CREATE INDEX IF NOT EXISTS idx_sub_payment_attempts_invoice
    ON subscription_payment_attempts (invoice_id, created_at DESC);

-- Index lookup theo paymentLinkId khi webhook PayOS gọi về
CREATE INDEX IF NOT EXISTS idx_sub_payment_attempts_provider_reference
    ON subscription_payment_attempts (provider_reference)
    WHERE provider_reference IS NOT NULL;

-- Index lookup theo orderCode khi polling PayOS API
CREATE INDEX IF NOT EXISTS idx_sub_payment_attempts_order_code
    ON subscription_payment_attempts (provider_order_code)
    WHERE provider_order_code IS NOT NULL;

-- Unique partial index: mỗi paymentLinkId chỉ tương ứng 1 attempt
-- (PayOS không tái sử dụng paymentLinkId, nên constraint này an toàn)
CREATE UNIQUE INDEX IF NOT EXISTS uidx_sub_payment_attempts_provider_reference
    ON subscription_payment_attempts (provider_reference)
    WHERE provider_reference IS NOT NULL;
