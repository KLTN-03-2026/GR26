package com.smartfnb.payment.infrastructure.persistence;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO đại diện cho Order được lấy từ Order Module.
 * Dùng để trao đổi dữ liệu giữa Payment và Order modules.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public record OrderDto(
    UUID id,
    UUID tenantId,
    UUID branchId,
    UUID tableId,
    String orderNumber,
    BigDecimal subtotal,
    BigDecimal discountAmount,
    BigDecimal taxAmount,
    BigDecimal totalAmount,
    List<OrderItemDto> items
) {
    public record OrderItemDto(
        UUID itemId,
        String itemName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
    ) {}
}
