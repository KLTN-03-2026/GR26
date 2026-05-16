package com.smartfnb.plan.infrastructure.persistence;

// author: Hoàng | date: 2026-05-16
// note: Entity cho bảng subscription_payment_attempts.
//       Lưu mỗi lần Owner tạo QR/link thanh toán gói dịch vụ qua PayOS.
//       Tách khỏi subscription_invoices để hỗ trợ tạo lại QR nhiều lần
//       và xử lý webhook idempotent theo provider_reference (paymentLinkId).

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity cho bảng subscription_payment_attempts.
 * Đại diện cho một lần thử thanh toán hóa đơn gói dịch vụ qua PayOS.
 *
 * <p>Một invoice có thể có nhiều attempt (nếu user tạo lại QR nhiều lần).
 * Chỉ attempt đầu tiên được đánh dấu PAID khi PayOS webhook về thành công.</p>
 *
 * @author Hoàng
 * @since 2026-05-16
 */
@Entity
@Table(name = "subscription_payment_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPaymentAttemptJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Invoice tương ứng với lần thanh toán này */
    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;

    /** Tenant sở hữu invoice — redundant để query nhanh mà không cần JOIN */
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /**
     * Nhà cung cấp thanh toán.
     * Giá trị: PAYOS | VIETQR | MOMO
     */
    @Column(name = "provider", nullable = false, length = 30)
    private String provider;

    /** Số tiền thanh toán (bằng với invoice.amount tại thời điểm tạo QR) */
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /**
     * Trạng thái của attempt.
     * PENDING   — QR đã tạo, chờ người dùng quét
     * PAID      — PayOS webhook xác nhận thành công
     * FAILED    — webhook báo thất bại
     * EXPIRED   — link PayOS hết hạn
     * CANCELLED — user huỷ trên trang PayOS
     */
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    /**
     * paymentLinkId từ PayOS — dùng để tìm attempt khi webhook về.
     * Unique trong DB (partial unique index WHERE NOT NULL).
     */
    @Column(name = "provider_reference", length = 100)
    private String providerReference;

    /**
     * orderCode từ PayOS — số nguyên dương ≤ 10^10.
     * Dùng để polling PayOS API GET /v2/payment-requests/{orderCode}.
     */
    @Column(name = "provider_order_code")
    private Long providerOrderCode;

    /** URL thanh toán PayOS — mở trong browser hoặc dùng làm nút CTA trên FE */
    @Column(name = "checkout_url", columnDefinition = "text")
    private String checkoutUrl;

    /** Raw QR string từ PayOS SDK — FE có thể vẽ QR bằng thư viện client-side */
    @Column(name = "qr_code", columnDefinition = "text")
    private String qrCode;

    /** Thời điểm link PayOS hết hạn — FE dùng để hiển thị countdown và nhắc tạo lại QR */
    @Column(name = "expires_at")
    private Instant expiresAt;

    /** Thời điểm PayOS webhook xác nhận thanh toán thành công */
    @Column(name = "paid_at")
    private Instant paidAt;

    /** Thời điểm tạo attempt — tự động set bởi Hibernate */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
