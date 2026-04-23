package com.smartfnb.order.application.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Request DTO để cập nhật thông tin đơn hàng.
 * 
 * @author vutq
 * @since 2026-04-11
 */
public record UpdateOrderRequest(
    UUID tableId,
    String notes,
    @NotEmpty List<UpdateOrderItemRequest> items
) {
    public record UpdateOrderItemRequest(
        UUID id, // null nếu là món mới
        @NotNull UUID itemId,
        @NotNull String itemName,
        int quantity,
        @NotNull BigDecimal unitPrice,
        String addons,
        String notes
    ) {}
}
