package com.smartfnb.supplier.infrastructure.persistence;

import com.smartfnb.supplier.domain.exception.InvalidPurchaseOrderStatusException;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * JPA Entity cho bảng purchase_orders.
 * Vòng đời: DRAFT → SENT → RECEIVED | CANCELLED
 *
 * @author vutq
 * @since 2026-04-07
 */
@Entity
@Table(
    name = "purchase_orders",
    indexes = {
        @Index(name = "idx_po_tenant_branch", columnList = "tenant_id, branch_id"),
        @Index(name = "idx_po_supplier",      columnList = "supplier_id"),
        @Index(name = "idx_po_status",        columnList = "tenant_id, status")
    }
)
@Getter
@Setter(AccessLevel.PACKAGE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PurchaseOrderJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "branch_id", nullable = false, updatable = false)
    private UUID branchId;

    @Column(name = "supplier_id", nullable = false)
    private UUID supplierId;

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "expected_date")
    private LocalDate expectedDate;

    @Column(name = "received_at")
    private Instant receivedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalAmount;

    @Column(name = "created_by", nullable = false, updatable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PurchaseOrderItemJpaEntity> items = new ArrayList<>();

    // ── Status helpers ────────────────────────────────────────────────

    public boolean isDraft()      { return "DRAFT".equals(status); }
    public boolean isSent()       { return "SENT".equals(status); }
    public boolean isReceived()   { return "RECEIVED".equals(status); }
    public boolean isCancelled()  { return "CANCELLED".equals(status); }

    // ── Factory ───────────────────────────────────────────────────────

    public static PurchaseOrderJpaEntity create(UUID tenantId, UUID branchId, UUID supplierId,
                                                  String orderNumber, String note,
                                                  LocalDate expectedDate, UUID createdBy) {
        PurchaseOrderJpaEntity e = new PurchaseOrderJpaEntity();
        e.tenantId     = tenantId;
        e.branchId     = branchId;
        e.supplierId   = supplierId;
        e.orderNumber  = orderNumber;
        e.status       = "DRAFT";
        e.note         = note;
        e.expectedDate = expectedDate;
        e.totalAmount  = BigDecimal.ZERO;
        e.createdBy    = createdBy;
        e.createdAt    = Instant.now();
        e.updatedAt    = Instant.now();
        return e;
    }

    // ── Domain behaviour ─────────────────────────────────────────────

    /** Chuyển DRAFT → SENT */
    public void send() {
        if (!isDraft()) {
            throw new InvalidPurchaseOrderStatusException(status, "SENT");
        }
        this.status    = "SENT";
        this.updatedAt = Instant.now();
    }

    /** Chuyển SENT → RECEIVED */
    public void receive() {
        if (!isSent()) {
            throw new InvalidPurchaseOrderStatusException(status, "RECEIVED");
        }
        this.status     = "RECEIVED";
        this.receivedAt = Instant.now();
        this.updatedAt  = Instant.now();
    }

    /** Huỷ PO (chỉ DRAFT hoặc SENT) */
    public void cancel(String reason) {
        if (isReceived()) {
            throw new InvalidPurchaseOrderStatusException(status, "CANCELLED");
        }
        if (isCancelled()) {
            throw new InvalidPurchaseOrderStatusException(status, "CANCELLED");
        }
        this.status       = "CANCELLED";
        this.cancelReason = reason;
        this.cancelledAt  = Instant.now();
        this.updatedAt    = Instant.now();
    }

    /** Cập nhật thông tin (chỉ khi DRAFT) */
    public void update(UUID supplierId, String note, LocalDate expectedDate) {
        if (!isDraft()) {
            throw new InvalidPurchaseOrderStatusException(status, "update");
        }
        this.supplierId   = supplierId;
        this.note         = note;
        this.expectedDate = expectedDate;
        this.updatedAt    = Instant.now();
    }

    /** Tính lại totalAmount từ danh sách items */
    public void recalculateTotal() {
        this.totalAmount = items.stream()
                .map(PurchaseOrderItemJpaEntity::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.updatedAt = Instant.now();
    }
}
