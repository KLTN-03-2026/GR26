package com.smartfnb.supplier.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * JPA Entity cho bảng purchase_order_items.
 * Mỗi dòng là một nguyên liệu trong đơn mua hàng.
 *
 * @author SmartF&B Team
 * @since 2026-04-07
 */
@Entity
@Table(
    name = "purchase_order_items",
    indexes = {
        @Index(name = "idx_po_items_po", columnList = "purchase_order_id")
    }
)
@Getter
@Setter(AccessLevel.PACKAGE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PurchaseOrderItemJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrderJpaEntity purchaseOrder;

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalPrice;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    /**
     * Factory method tạo item trong PO.
     */
    public static PurchaseOrderItemJpaEntity create(PurchaseOrderJpaEntity po,
                                                     UUID itemId, String itemName, String unit,
                                                     BigDecimal quantity, BigDecimal unitPrice,
                                                     String note) {
        PurchaseOrderItemJpaEntity e = new PurchaseOrderItemJpaEntity();
        e.purchaseOrder = po;
        e.itemId        = itemId;
        e.itemName      = itemName;
        e.unit          = unit;
        e.quantity      = quantity;
        e.unitPrice     = unitPrice;
        e.totalPrice    = quantity.multiply(unitPrice);
        e.note          = note;
        return e;
    }
}
