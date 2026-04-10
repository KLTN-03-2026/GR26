package com.smartfnb.order.application.dto;

import com.smartfnb.order.domain.model.Order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public record OrderResponse(
    UUID id,
    String orderNumber,
    UUID tableId,
    String source,
    String status,
    BigDecimal subtotal,
    BigDecimal discountAmount,
    BigDecimal taxAmount,
    BigDecimal totalAmount,
    String notes,
    Instant completedAt,
    List<OrderItemResponse> items
) {
    public static OrderResponse from(Order order) {
        List<OrderItemResponse> itemResponses = null;
        if (order.getItems() != null) {
            itemResponses = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                    item.getId(), item.getItemId(), item.getItemName(),
                    item.getQuantity(), item.getUnitPrice(), item.getTotalPrice(),
                    item.getAddons(), item.getNotes(), 
                    item.getStatus() != null ? item.getStatus().name() : null
                )).collect(Collectors.toList());
        }

        return new OrderResponse(
            order.getId(),
            order.getOrderNumber(),
            order.getTableId(),
            order.getSource() != null ? order.getSource().name() : null,
            order.getStatus() != null ? order.getStatus().name() : null,
            order.getSubtotal(),
            order.getDiscountAmount(),
            order.getTaxAmount(),
            order.getTotalAmount(),
            order.getNotes(),
            order.getCompletedAt(),
            itemResponses
        );
    }
}
