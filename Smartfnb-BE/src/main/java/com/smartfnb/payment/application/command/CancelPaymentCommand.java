package com.smartfnb.payment.application.command;

import java.util.UUID;

/**
 * Command hủy Payment đang chờ xử lý.
 *
 * author: Hoàng | date: 2026-05-16 | note: Dùng khi nhân viên đã tạo QR nhưng khách muốn sửa đơn trước khi thanh toán.
 */
public record CancelPaymentCommand(
        UUID paymentId
) {
}
