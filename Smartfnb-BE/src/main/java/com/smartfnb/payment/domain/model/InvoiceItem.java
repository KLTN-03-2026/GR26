package com.smartfnb.payment.domain.model;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Hạng mục trong Hóa đơn.
 * Là snapshot của OrderItem tại thời điểm bán.
 * Không thay đổi sau khi tạo.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InvoiceItem {
    private UUID id;
    private UUID invoiceId;
    private String itemName;          // Snapshot tên lúc bán
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;

    /**
     * Tạo InvoiceItem từ OrderItem snapshot.
     */
    public static InvoiceItem create(
            String itemName, int quantity, BigDecimal unitPrice, BigDecimal totalPrice) {
        InvoiceItem item = new InvoiceItem();
        item.id = UUID.randomUUID();
        item.itemName = itemName;
        item.quantity = quantity;
        item.unitPrice = unitPrice;
        item.totalPrice = totalPrice;
        return item;
    }

    /**
     * Reconstruct InvoiceItem từ JPA entity.
     */
    public static InvoiceItem reconstruct(
            UUID id, UUID invoiceId, String itemName, int quantity,
            BigDecimal unitPrice, BigDecimal totalPrice) {
        InvoiceItem item = new InvoiceItem();
        item.id = id;
        item.invoiceId = invoiceId;
        item.itemName = itemName;
        item.quantity = quantity;
        item.unitPrice = unitPrice;
        item.totalPrice = totalPrice;
        return item;
    }
}
