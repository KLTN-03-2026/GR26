package com.smartfnb.payment.domain.model;

/**
 * Trạng thái của QR Code.
 * QR được khởi tạo → chờ thanh toán (3 phút) → thanh toán thành công/thất bại.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public enum QRCodeStatus {
    /**
     * QR vừa được tạo, chờ khách hàng quét.
     */
    ACTIVE("Hoạt động"),

    /**
     * QR đã hết hạn (quá 3 phút).
     */
    EXPIRED("Hết hạn"),

    /**
     * QR thanh toán thành công, không còn sử dụng.
     */
    COMPLETED("Hoàn tất"),

    /**
     * QR bị cancel bởi nhân viên.
     */
    CANCELLED("Bị hủy");

    private final String displayName;

    QRCodeStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
