package com.smartfnb.inventory.domain.event;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Event phát ra khi đã trừ kho xong cho một đơn hàng và tính được tổng giá vốn.
 * Được Report Module lắng nghe để cập nhật lợi nhuận.
 *
 * Author: Hoàng
 * Date: 2026-05-09
 * Note: Bổ sung orderId và cost theo món để report cập nhật COGS tổng và daily_item_stats.
 */
public record OrderCostCalculatedEvent(
    UUID tenantId,
    UUID branchId,
    LocalDate date,
    UUID orderId,
    BigDecimal totalCost,
    List<ItemCost> itemCosts
) {
    /**
     * Giá vốn phát sinh cho một món bán trong đơn.
     */
    public record ItemCost(
        UUID itemId,
        BigDecimal cost
    ) {}
}
