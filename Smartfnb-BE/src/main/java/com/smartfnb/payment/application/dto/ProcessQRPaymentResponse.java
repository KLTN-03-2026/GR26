package com.smartfnb.payment.application.dto;

import java.util.UUID;

/**
 * Response DTO khi QR Code được tạo thành công.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record ProcessQRPaymentResponse(
    UUID paymentId,
    String qrCodeUrl,       // URL để hiển thị QR trên POS/app
    String qrCodeData,      // Base64 encoded image (nếu cần)
    long expiresInSeconds,  // 180 (3 phút)
    String orderNumber
) {}
