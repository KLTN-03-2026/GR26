package com.smartfnb.payment.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * JPA Entity đại diện cho Invoice trong database.
 * Mapped từ Domain Entity Invoice.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
@Entity
@Table(
    name = "invoices",
    indexes = {
        @Index(name = "idx_invoices_branch_date", columnList = "branch_id, issued_at DESC"),
        @Index(name = "idx_invoices_tenant_date", columnList = "tenant_id, issued_at DESC")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InvoiceJpaEntity {
    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private UUID branchId;

    @Column(nullable = false)
    private UUID orderId;

    @Column(nullable = false)
    private UUID paymentId;

    @Column(nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 12, scale = 2)
    private BigDecimal discount;

    @Column(precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(nullable = false)
    private Instant issuedAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceItemJpaEntity> items = new ArrayList<>();
}
