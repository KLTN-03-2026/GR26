package com.smartfnb.order.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Phát ra khi đơn hàng bị hủy.
 * Consumer: WebSocket -> Broadcast thông báo hủy
 *           InventoryModule -> hoàn kho (nếu cần)
 *           ReportModule -> cập nhật báo cáo
 *
 * @author vutq
 * @since 2026-03-31
 */
public record OrderCancelledEvent(
    UUID orderId,
    UUID tenantId,
    UUID branchId,
    String orderNumber,
    Instant occurredAt
) {}
