package com.smartfnb.order.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Phát ra khi đơn hàng được tạo thành công.
 * Consumer: WebSocket -> Broadcast thông báo bếp realtime
 *           NotificationModule -> Thông báo bếp
 *
 * @author vutq
 * @since 2026-03-31
 */
public record OrderCreatedEvent(
    UUID orderId,
    UUID branchId,
    String orderNumber,
    Instant occurredAt
) {}
