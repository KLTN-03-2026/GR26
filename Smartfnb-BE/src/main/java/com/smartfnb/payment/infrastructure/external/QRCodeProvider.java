package com.smartfnb.payment.infrastructure.external;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Interface cho external QR Code provider (VietQR, MoMo).
 * Implementation sẽ gọi API của payment gateway tương ứng.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public interface QRCodeProvider {
    /**
     * Tạo QR Code cho thanh toán.
     * @param paymentId ID của Payment record
     * @param amount Số tiền cần thanh toán
     * @param orderNumber Số đơn hàng (để hiển thị trên QR/app)
     * @return QR code URL hoặc data
     */
    QRCodeResponse generateQRCode(UUID paymentId, BigDecimal amount, String orderNumber) throws Exception;

    /**
     * Lấy trạng thái thanh toán QR từ gateway.
     * Dùng để polling hoặc xác minh khi webhook đến.
     */
    QRStatusResponse checkPaymentStatus(UUID paymentId, String transactionId) throws Exception;

    /**
     * Hủy QR Code (nếu backend support).
     */
    void cancelQRCode(UUID paymentId) throws Exception;

    /**
     * Response khi QR được tạo thành công.
     */
    record QRCodeResponse(
        String qrCodeUrl,      // URL để hiển thị QR
        String qrCodeData,     // Raw data nếu là base64 image
        String transactionId,  // Transaction ID từ gateway
        long expiresInSeconds  // Thời gian hết hạn (thường 180s)
    ) {}

    /**
     * Response khi check payment status.
     */
    record QRStatusResponse(
        String status,         // success, pending, expired, failed
        String transactionId,
        BigDecimal amount,
        Long paidAtTimestamp   // Unix timestamp khi thanh toán thành công
    ) {}
}
