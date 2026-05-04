package com.smartfnb.order.application.command;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Lệnh cập nhật đơn hàng.
 * 
 * @author vutq
 * @since 2026-04-11
 */
public record UpdateOrderCommand(
    UUID orderId,
    UUID tenantId,
    UUID branchId,
    UUID staffId,
    UUID tableId,
    String notes,
    List<UpdateOrderItemCommand> items
) {
    public record UpdateOrderItemCommand(
        UUID id,
        UUID itemId,
        String itemName,
        int quantity,
        BigDecimal unitPrice,
        String addons,
        String notes
    ) {}
}
