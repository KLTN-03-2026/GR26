-- ============================================================
-- V26: POS Session Cash Reconciliation
-- author: Hoàng | date: 2026-04-30
-- note: Liên kết payment và expense với ca POS để backend
--       tính đúng endingCashExpected cuối ca thay vì = startingCash.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Thêm pos_session_id vào bảng payments
--    Nullable: payment cũ (trước khi deploy) không có session.
--    Chỉ CASH payment trong ca OPEN mới có giá trị.
-- author: Hoàng | date: 2026-04-30 | note: Liên kết payment với ca POS để đối soát tiền mặt cuối ca.
-- ------------------------------------------------------------
ALTER TABLE payments
    ADD COLUMN pos_session_id UUID NULL;

CREATE INDEX idx_payments_pos_session_id
    ON payments (pos_session_id);

-- ------------------------------------------------------------
-- 2. Thêm pos_session_id vào bảng expenses
--    Rule: expense paymentMethod='CASH' có posSessionId → trừ vào két POS.
--    Expense từ nguồn khác (chuyển khoản, v.v.) posSessionId = NULL.
-- author: Hoàng | date: 2026-04-30 | note: Liên kết phiếu chi tiền mặt với ca POS để trừ khỏi tiền kỳ vọng cuối ca.
-- ------------------------------------------------------------
ALTER TABLE expenses
    ADD COLUMN pos_session_id UUID NULL;

CREATE INDEX idx_expenses_pos_session_id
    ON expenses (pos_session_id);

-- ------------------------------------------------------------
-- 3. Thêm breakdown columns vào bảng pos_sessions
--    Lưu lại tại thời điểm đóng ca để history page không cần
--    tính lại từ joined tables.
-- author: Hoàng | date: 2026-04-30 | note: Lưu breakdown giúp FE giải thích số tiền kỳ vọng cuối ca trong lịch sử.
-- ------------------------------------------------------------
ALTER TABLE pos_sessions
    ADD COLUMN cash_sales    NUMERIC(12, 2) NULL,
    ADD COLUMN cash_expenses NUMERIC(12, 2) NULL;
