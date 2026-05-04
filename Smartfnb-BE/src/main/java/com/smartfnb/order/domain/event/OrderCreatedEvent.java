package com.smartfnb.order.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Phát ra khi đơn hàng được tạo thành công.
 * Consumer: WebSocket -> Broadcast thông báo bếp realtime
 *           NotificationModule -> Thông báo bếp
 *
 * <p>tenantId được thêm vào để OrderWebSocketEventHandler có thể
 * enrich event từ DB qua {@code findByIdAndTenantId} mà không cần
 * thêm findById() unconstrained vào domain repository.</p>
 *
 * @author vutq
 * @since 2026-03-31
 */
public record OrderCreatedEvent(
    UUID orderId,
    UUID tenantId,
    UUID branchId,
    String orderNumber,
    Instant occurredAt
) {}
