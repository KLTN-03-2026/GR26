package com.smartfnb.plan.application.dto;

import java.util.UUID;

/**
 * Response khi Owner hủy hóa đơn gói đang chờ thanh toán.
 *
 * @param invoiceId          ID hóa đơn gói dịch vụ
 * @param invoiceNumber      mã hóa đơn hiển thị cho người dùng
 * @param status             trạng thái hóa đơn sau khi xử lý
 * @param cancelledAttemptId ID payment attempt bị hủy, null nếu không có attempt cần hủy
 * @param message            thông điệp nghiệp vụ cho FE hiển thị
 *
 * author: Hoàng | date: 2026-05-16 | note: Dùng cho flow owner đổi gói sau khi đã tạo QR thanh toán.
 */
public record CancelTenantInvoiceResponse(
        UUID invoiceId,
        String invoiceNumber,
        String status,
        UUID cancelledAttemptId,
        String message
) {
}
