package com.smartfnb.payment.domain.model;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Aggregate Root đại diện cho Giao dịch thanh toán.
 * Thu ngân tạo Payment → Tạo Invoice → Cập nhật trạng thái bàn.
 * Immutable sau khi COMPLETED.
 *
 * @author vutq
 * @since 2026-04-01
 */
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {
    private UUID id;
    private UUID tenantId;
    private UUID orderId;
    private BigDecimal amount;
    private PaymentMethod method;
    private PaymentStatus status;
    private String transactionId; // ID từ payment gateway
    private UUID cashierUserId;
    private Instant qrExpiresAt; // Thời gian hết hạn QR (3 phút)
    private Instant paidAt; // Thời gian thanh toán thành công
    private Instant createdAt;
    private Long version;
    // author: Hoàng | date: 2026-04-30 | note: Gắn payment với ca POS để backend tính đối soát tiền mặt cuối ca.
    private UUID posSessionId;

    /**
     * Tạo Payment mới cho giao dịch tiền mặt.
     * author: Hoàng | date: 2026-04-30 | note: Thêm posSessionId để liên kết với ca POS đang mở.
     */
    public static Payment createCashPayment(
            UUID tenantId, UUID orderId, BigDecimal amount, UUID cashierUserId, UUID posSessionId) {
        Payment payment = new Payment();
        payment.id = UUID.randomUUID();
        payment.tenantId = tenantId;
        payment.orderId = orderId;
        payment.amount = amount;
        payment.method = PaymentMethod.CASH;
        payment.status = PaymentStatus.PENDING;
        payment.cashierUserId = cashierUserId;
        payment.createdAt = Instant.now();
        // author: Hoàng | date: 2026-04-30 | note: Gắn posSessionId — null nếu không có ca POS đang mở (không nên xảy ra ở POS quầy).
        payment.posSessionId = posSessionId;
        return payment;
    }

    /**
     * Tạo Payment mới cho thanh toán QR (VietQR/MoMo/PayOS).
     * QR sẽ hết hạn sau 3 phút.
     * author: Hoàng | date: 2026-04-30 | note: Thêm posSessionId để báo cáo doanh thu theo ca, QR không cộng vào két tiền mặt.
     */
    public static Payment createQRPayment(
            UUID tenantId, UUID orderId, BigDecimal amount,
            PaymentMethod qrMethod, UUID cashierUserId, UUID posSessionId) {
        /*
         * author: Hoàng
         * date: 27-04-2026
         * note: Thêm validate QR method ngay trong
         * factory method để đảm bảo chỉ tạo Payment với method hợp lệ. Nếu method không
         * hợp lệ, sẽ ném IllegalArgumentException.
         */
        if (qrMethod != PaymentMethod.VIETQR && qrMethod != PaymentMethod.MOMO && qrMethod != PaymentMethod.PAYOS) {
            throw new IllegalArgumentException("QR method phải là VIETQR, MOMO hoặc PAYOS");
        }

        Payment payment = new Payment();
        payment.id = UUID.randomUUID();
        payment.tenantId = tenantId;
        payment.orderId = orderId;
        payment.amount = amount;
        payment.method = qrMethod;
        payment.status = PaymentStatus.PENDING;
        payment.cashierUserId = cashierUserId;
        payment.qrExpiresAt = Instant.now().plusSeconds(180); // 3 phút
        payment.createdAt = Instant.now();
        // author: Hoàng | date: 2026-04-30 | note: Gắn posSessionId để báo cáo doanh thu QR theo ca POS.
        payment.posSessionId = posSessionId;
        return payment;
    }

    /**
     * Xác nhận Payment thành công.
     * Chỉ được phép từ PENDING → COMPLETED.
     */
    public void markCompleted(String transactionId) {
        markCompleted(transactionId, false);
    }

    /**
     * Xác nhận Payment thành công.
     * Khi gateway đã trả trạng thái PAID thì cho phép hoàn tất dù QR local vừa hết hạn.
     *
     * author: Hoàng | date: 27-04-2026 | note: Cho phép webhook/polling đã xác minh bởi gateway bỏ qua expiry local.
     */
    public void markCompleted(String transactionId, boolean allowExpiredQr) {
        if (this.status != PaymentStatus.PENDING) {
            throw new IllegalStateException(
                    String.format("Không thể hoàn tất Payment ở trạng thái %s", this.status));
        }

        // Chỉ chặn hết hạn với xác nhận thủ công hoặc luồng chưa được gateway xác minh.
        if (!allowExpiredQr && this.qrExpiresAt != null && Instant.now().isAfter(this.qrExpiresAt)) {
            throw new IllegalStateException("QR code đã hết hạn (quá 3 phút)");
        }

        this.status = PaymentStatus.COMPLETED;
        this.transactionId = transactionId;
        this.paidAt = Instant.now();
    }

    /**
     * Gắn mã giao dịch từ gateway cho QR payment đang chờ xử lý.
     * PayOS webhook dùng paymentLinkId này để tìm lại payment nội bộ.
     */
    public void attachGatewayTransaction(String transactionId) {
        if (this.status != PaymentStatus.PENDING) {
            throw new IllegalStateException(
                    String.format("Chỉ được gắn transaction cho Payment PENDING, hiện tại là %s", this.status));
        }
        if (transactionId == null || transactionId.isBlank()) {
            throw new IllegalArgumentException("transactionId không được để trống");
        }

        this.transactionId = transactionId;
    }

    /**
     * Xác nhận Payment thất bại.
     */
    public void markFailed(String reason) {
        if (this.status == PaymentStatus.COMPLETED || this.status == PaymentStatus.REFUNDED) {
            throw new IllegalStateException(
                    String.format("Không thể đánh dấu FAILED từ %s", this.status));
        }
        this.status = PaymentStatus.FAILED;
    }

    /**
     * Hoàn tiền Payment.
     */
    public void markRefunded() {
        if (this.status != PaymentStatus.COMPLETED) {
            throw new IllegalStateException(
                    "Chỉ có thể hoàn tiền từ Payment ở trạng thái COMPLETED");
        }
        this.status = PaymentStatus.REFUNDED;
    }

    /**
     * Kiểm tra QR code còn hạn hay không.
     */
    public boolean isQRExpired() {
        return this.qrExpiresAt != null && Instant.now().isAfter(this.qrExpiresAt);
    }

    /**
     * Kiểm tra Payment đã hoàn tất không.
     */
    public boolean isCompleted() {
        return this.status == PaymentStatus.COMPLETED;
    }

    /**
     * Reconstruct Payment từ JPA entity.
     * author: Hoàng | date: 2026-04-30 | note: Thêm posSessionId vào reconstruct để đồng bộ với schema V26.
     */
    public static Payment reconstruct(
            UUID id, UUID tenantId, UUID orderId, BigDecimal amount, PaymentMethod method,
            PaymentStatus status, String transactionId, UUID cashierUserId,
            Instant qrExpiresAt, Instant paidAt, Instant createdAt, Long version, UUID posSessionId) {
        Payment payment = new Payment();
        payment.id = id;
        payment.tenantId = tenantId;
        payment.orderId = orderId;
        payment.amount = amount;
        payment.method = method;
        payment.status = status;
        payment.transactionId = transactionId;
        payment.cashierUserId = cashierUserId;
        payment.qrExpiresAt = qrExpiresAt;
        payment.paidAt = paidAt;
        payment.createdAt = createdAt;
        payment.version = version;
        payment.posSessionId = posSessionId;
        return payment;
    }
}
