package com.smartfnb.order.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Phát ra khi trạng thái đơn hàng thay đổi.
 * Consumer: WebSocket gateway broadcast
 *
 * @author SmartF&B Team
 */
public record OrderStatusChangedEvent(
    UUID orderId,
    UUID branchId,
    String orderNumber,
    String oldStatus,
    String newStatus,
    UUID changedByStaffId,
    Instant occurredAt
) {}
