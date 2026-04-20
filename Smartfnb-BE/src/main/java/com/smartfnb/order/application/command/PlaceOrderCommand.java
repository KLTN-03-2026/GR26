package com.smartfnb.order.application.command;

import com.smartfnb.order.domain.model.OrderSource;
import java.util.List;
import java.util.UUID;

public record PlaceOrderCommand(
    UUID tenantId,
    UUID branchId,
    UUID posSessionId,
    UUID staffId,
    UUID tableId,
    OrderSource source,
    String notes,
    List<OrderItemCommand> items
) {
    public record OrderItemCommand(
        UUID itemId,
        String itemName,
        int quantity,
        java.math.BigDecimal unitPrice,
        String addons,
        String notes
    ) {}
}
