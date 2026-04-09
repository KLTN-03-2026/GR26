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
 * @author SmartF&B Team
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
    private String transactionId;          // ID từ payment gateway
    private UUID cashierUserId;
    private Instant qrExpiresAt;           // Thời gian hết hạn QR (3 phút)
    private Instant paidAt;                // Thời gian thanh toán thành công
    private Instant createdAt;
    private Long version;

    /**
     * Tạo Payment mới cho giao dịch tiền mặt.
     */
    public static Payment createCashPayment(
            UUID tenantId, UUID orderId, BigDecimal amount, UUID cashierUserId) {
        Payment payment = new Payment();
        payment.id = UUID.randomUUID();
        payment.tenantId = tenantId;
        payment.orderId = orderId;
        payment.amount = amount;
        payment.method = PaymentMethod.CASH;
        payment.status = PaymentStatus.PENDING;
        payment.cashierUserId = cashierUserId;
        payment.createdAt = Instant.now();
        return payment;
    }

    /**
     * Tạo Payment mới cho thanh toán QR (VietQR/MoMo).
     * QR sẽ hết hạn sau 3 phút.
     */
    public static Payment createQRPayment(
            UUID tenantId, UUID orderId, BigDecimal amount,
            PaymentMethod qrMethod, UUID cashierUserId) {
        if (qrMethod != PaymentMethod.VIETQR && qrMethod != PaymentMethod.MOMO) {
            throw new IllegalArgumentException("QR method phải là VIETQR hoặc MOMO");
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
        return payment;
    }

    /**
     * Xác nhận Payment thành công.
     * Chỉ được phép từ PENDING → COMPLETED.
     */
    public void markCompleted(String transactionId) {
        if (this.status != PaymentStatus.PENDING) {
            throw new IllegalStateException(
                String.format("Không thể hoàn tất Payment ở trạng thái %s", this.status));
        }

        // Kiểm tra QR chưa hết hạn
        if (this.qrExpiresAt != null && Instant.now().isAfter(this.qrExpiresAt)) {
            throw new IllegalStateException("QR code đã hết hạn (quá 3 phút)");
        }

        this.status = PaymentStatus.COMPLETED;
        this.transactionId = transactionId;
        this.paidAt = Instant.now();
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
     */
    public static Payment reconstruct(
            UUID id, UUID tenantId, UUID orderId, BigDecimal amount, PaymentMethod method,
            PaymentStatus status, String transactionId, UUID cashierUserId,
            Instant qrExpiresAt, Instant paidAt, Instant createdAt, Long version) {
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
        return payment;
    }
}
