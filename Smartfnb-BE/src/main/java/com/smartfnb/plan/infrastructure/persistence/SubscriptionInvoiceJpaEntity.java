package com.smartfnb.plan.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA Entity cho bảng subscription_invoices.
 * Đại diện cho một hóa đơn gia hạn gói dịch vụ của Tenant.
 *
 * <p>Hóa đơn là bất biến sau khi tạo — chỉ đổi status:
 * UNPAID → PAID (khi admin xác nhận) hoặc CANCELLED.</p>
 *
 * @author vutq
 * @since 2026-04-24
 */
@Entity
@Table(name = "subscription_invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionInvoiceJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Tenant sở hữu hóa đơn này */
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** Subscription được gia hạn bởi hóa đơn này */
    @Column(name = "subscription_id", nullable = false)
    private UUID subscriptionId;

    /** Gói dịch vụ tại thời điểm phát hành (snapshot) */
    @Column(name = "plan_id", nullable = false)
    private UUID planId;

    /**
     * Mã hóa đơn duy nhất, bất biến.
     * Định dạng: INV-YYYYMM-NNNNN (VD: INV-202604-00001)
     */
    @Column(name = "invoice_number", nullable = false, unique = true, updatable = false, length = 50)
    private String invoiceNumber;

    /** Số tiền phải thanh toán (tính theo gói × số tháng) */
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /** Ngày bắt đầu chu kỳ dịch vụ được gia hạn */
    @Column(name = "billing_period_start", nullable = false)
    private LocalDate billingPeriodStart;

    /** Ngày kết thúc chu kỳ dịch vụ được gia hạn */
    @Column(name = "billing_period_end", nullable = false)
    private LocalDate billingPeriodEnd;

    /**
     * Trạng thái hóa đơn.
     * UNPAID   — chưa thanh toán
     * PAID     — đã thanh toán (admin xác nhận)
     * CANCELLED — đã hủy
     */
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "UNPAID";

    /** Phương thức thanh toán: BANK_TRANSFER | MOMO | ZALOPAY | CASH */
    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    /** Thời điểm admin xác nhận thanh toán */
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    /** Ghi chú từ admin (lý do hủy, ghi chú đặc biệt...) */
    @Column(name = "note", columnDefinition = "text")
    private String note;

    /** Thời điểm tạo hóa đơn — tự động set */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
