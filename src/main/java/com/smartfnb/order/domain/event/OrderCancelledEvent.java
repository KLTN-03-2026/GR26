package com.smartfnb.order.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Phát ra khi đơn hàng bị huỷ.
 * Consumer: InventoryModule -> hoàn kho (nếu cần), ReportModule
 *
 * @author SmartF&B Team
 */
public record OrderCancelledEvent(
    UUID orderId,
    Instant occurredAt
) {}
