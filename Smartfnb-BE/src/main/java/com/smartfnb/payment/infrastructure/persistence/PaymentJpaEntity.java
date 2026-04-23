package com.smartfnb.payment.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity đại diện cho Payment trong database.
 * Mapped từ Domain Entity Payment.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
@Entity
@Table(
    name = "payments",
    indexes = {
        @Index(name = "idx_payments_order", columnList = "order_id"),
        @Index(name = "idx_payments_tenant", columnList = "tenant_id, created_at DESC")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PaymentJpaEntity {
    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private UUID orderId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 20)
    private String method;     // CASH, VIETQR, MOMO, ZALOPAY

    @Column(nullable = false, length = 20)
    private String status;     // PENDING, COMPLETED, FAILED, REFUNDED

    @Column(length = 255)
    private String transactionId;

    @Column
    private UUID cashierUserId;

    @Column
    private Instant qrExpiresAt;

    @Column
    private Instant paidAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Version
    private Long version;
}
