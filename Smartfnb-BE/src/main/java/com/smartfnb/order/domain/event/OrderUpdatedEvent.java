package com.smartfnb.order.domain.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Sự kiện phát ra khi đơn hàng được cập nhật thông tin (món ăn, ghi chú, bàn).
 * 
 * @author vutq
 * @since 2026-04-11
 */
public record OrderUpdatedEvent(
    UUID orderId,
    UUID tenantId,
    UUID branchId,
    UUID staffId,
    String orderNumber,
    BigDecimal totalAmount,
    Instant occurredAt
) {}
