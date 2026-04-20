package com.smartfnb.order.application.dto;

import com.smartfnb.order.domain.model.OrderSource;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PlaceOrderRequest(
    UUID tableId,
    OrderSource source,
    @NotEmpty List<OrderItemRequest> items,
    String notes
) {
    public record OrderItemRequest(
        @NotNull UUID itemId,
        @NotNull String itemName,
        int quantity,
        @NotNull BigDecimal unitPrice,
        String addons,
        String notes
    ) {}
}
