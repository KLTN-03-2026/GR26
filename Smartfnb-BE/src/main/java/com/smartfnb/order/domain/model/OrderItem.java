package com.smartfnb.order.domain.model;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entity con của Order Aggregate Root. (Domain Object)
 * 
 * @author SmartF&B Team
 */
@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {
    private UUID id;
    private UUID itemId;
    private String itemName;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private String addons; // JSON String
    private String notes;
    private OrderItemStatus status;

    public void init() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.status == null) {
            this.status = OrderItemStatus.PENDING;
        }
        if (this.totalPrice == null) {
            this.totalPrice = this.unitPrice.multiply(BigDecimal.valueOf(this.quantity));
        }
    }

    public void updateStatus(OrderItemStatus status) {
        this.status = status;
    }
}
