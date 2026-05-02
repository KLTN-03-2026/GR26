package com.smartfnb.plan.application.port;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Port interface để module Plan gọi dịch vụ sinh QR mà không phụ thuộc trực tiếp
 * vào implementation của module Payment.
 *
 * <p>Tuân thủ kiến trúc DDD: module cấp thấp (plan) không được import từ
 * module cấp cao (payment). Giao tiếp thông qua Port → Adapter.</p>
 *
 * @author vutq
 * @since 2026-04-30
 */
public interface PlanQRCodePort {

    /**
     * Sinh mã QR để thanh toán hóa đơn gói dịch vụ.
     *
     * @param invoiceId     UUID hóa đơn (dùng làm referenceId gửi cho gateway)
     * @param amount        Số tiền thanh toán
     * @param invoiceNumber Mã hóa đơn (INV-YYYYMM-NNNNN) — hiển thị trong app ngân hàng
     * @param method        Phương thức: "VIETQR" | "MOMO"
     * @return QRResult chứa url, data và thời gian hết hạn
     * @throws PlanQRCodeException nếu gateway trả lỗi hoặc method không hỗ trợ
     */
    QRResult generateQR(UUID invoiceId, BigDecimal amount, String invoiceNumber, String method);

    /**
     * Kết quả sinh QR trả về cho service.
     *
     * @param qrCodeUrl      URL ảnh QR để hiển thị cho User
     * @param qrCodeData     Chuỗi dữ liệu QR thô
     * @param expiresInSeconds Thời gian hết hạn (giây)
     */
    record QRResult(String qrCodeUrl, String qrCodeData, long expiresInSeconds) {}

    /**
     * Exception chuyên biệt khi không thể sinh QR.
     */
    class PlanQRCodeException extends RuntimeException {
        public PlanQRCodeException(String message) {
            super(message);
        }
        public PlanQRCodeException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
