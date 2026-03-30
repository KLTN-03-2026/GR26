package com.smartfnb.order.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Phát ra khi đơn hàng được tạo thành công.
 * Consumer: NotificationModule -> Thông báo bếp
 *
 * @author SmartF&B Team
 */
public record OrderCreatedEvent(
    UUID orderId,
    Instant occurredAt
) {}
