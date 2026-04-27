-- =================================================================
-- V25: Thêm PAYOS vào danh sách phương thức thanh toán hợp lệ
-- =================================================================
-- author: Hoàng
-- date: 27-04-2026
-- note: Sửa CHECK constraint của cột method trong bảng payments
--       để cho phép giá trị 'PAYOS'.
-- =================================================================

ALTER TABLE payments DROP CONSTRAINT ck_payment_method;

ALTER TABLE payments
    ADD CONSTRAINT ck_payment_method
    CHECK (method IN ('CASH', 'VIETQR', 'MOMO', 'ZALOPAY', 'PAYOS'));
