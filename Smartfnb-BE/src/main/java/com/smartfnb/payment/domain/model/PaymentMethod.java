package com.smartfnb.payment.domain.model;

/**
 * Phương thức thanh toán trong hệ thống.
 * Bao gồm: Tiền mặt, QR code (VietQR, MoMo), ví điện tử.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public enum PaymentMethod {
    /**
     * Thanh toán bằng tiền mặt.
     */
    CASH("Tiền mặt"),

    /**
     * Thanh toán bằng VietQR.
     */
    VIETQR("VietQR"),

    /**
     * Thanh toán bằng MoMo.
     */
    MOMO("MoMo"),

    /**
     * Thanh toán bằng ZaloPay.
     */
    ZALOPAY("ZaloPay");

    private final String displayName;

    PaymentMethod(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
