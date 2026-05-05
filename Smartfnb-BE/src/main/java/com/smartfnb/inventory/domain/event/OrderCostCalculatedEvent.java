package com.smartfnb.inventory.domain.event;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Event phát ra khi đã trừ kho xong cho một đơn hàng và tính được tổng giá vốn.
 * Được Report Module lắng nghe để cập nhật lợi nhuận.
 */
public record OrderCostCalculatedEvent(
    UUID tenantId,
    UUID branchId,
    LocalDate date,
    BigDecimal totalCost
) {}
