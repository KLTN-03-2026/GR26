package com.smartfnb.payment.domain.model;

/**
 * Trạng thái giao dịch thanh toán.
 * Luồng: PENDING → COMPLETED hoặc FAILED/CANCELLED
 * Hoàn tiền: COMPLETED → REFUNDED
 *
 * @author vutq
 * @since 2026-04-01
 */
public enum PaymentStatus {
    /**
     * Chờ xác nhận (đặc biệt cho QR payment 3 phút).
     */
    PENDING("Chờ xác nhận"),

    /**
     * Thanh toán thành công.
     */
    COMPLETED("Thành công"),

    /**
     * Thanh toán thất bại.
     */
    FAILED("Thất bại"),

    /**
     * Đã hủy trước khi khách thanh toán.
     * author: Hoàng | date: 2026-05-16 | note: Dùng khi nhân viên hủy QR pending để sửa đơn.
     */
    CANCELLED("Đã hủy"),

    /**
     * Hoàn tiền.
     */
    REFUNDED("Đã hoàn");

    private final String displayName;

    PaymentStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
