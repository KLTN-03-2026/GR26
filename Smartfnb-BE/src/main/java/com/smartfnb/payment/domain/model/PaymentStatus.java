package com.smartfnb.payment.domain.model;

/**
 * Trạng thái giao dịch thanh toán.
 * Luồng: PENDING → COMPLETED hoặc FAILED
 * Hoàn tiền: COMPLETED → REFUNDED
 *
 * @author SmartF&B Team
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
