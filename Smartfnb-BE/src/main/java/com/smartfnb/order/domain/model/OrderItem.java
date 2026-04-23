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

    private static final com.fasterxml.jackson.databind.ObjectMapper MAPPER = new com.fasterxml.jackson.databind.ObjectMapper();

    public void init() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.status == null) {
            this.status = OrderItemStatus.PENDING;
        }
        if (this.totalPrice == null) {
            this.totalPrice = this.unitPrice.add(calculateAddonsPrice()).multiply(BigDecimal.valueOf(this.quantity));
        }
    }

    private BigDecimal calculateAddonsPrice() {
        if (this.addons == null || this.addons.isBlank()) return BigDecimal.ZERO;
        try {
            com.fasterxml.jackson.databind.JsonNode root = MAPPER.readTree(this.addons);
            if (!root.isArray()) return BigDecimal.ZERO;
            
            BigDecimal totalAddonPrice = BigDecimal.ZERO;
            for (com.fasterxml.jackson.databind.JsonNode node : root) {
                BigDecimal extraPrice = node.has("extraPrice") ? new BigDecimal(node.get("extraPrice").asText()) : BigDecimal.ZERO;
                int addonQty = node.has("quantity") ? node.get("quantity").asInt(1) : 1;
                totalAddonPrice = totalAddonPrice.add(extraPrice.multiply(BigDecimal.valueOf(addonQty)));
            }
            return totalAddonPrice;
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    public void updateStatus(OrderItemStatus status) {
        this.status = status;
    }

    public void update(int quantity, BigDecimal unitPrice, String addons, String notes) {
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.addons = addons;
        this.notes = notes;
        this.totalPrice = this.unitPrice.add(calculateAddonsPrice()).multiply(BigDecimal.valueOf(this.quantity));
    }
}
