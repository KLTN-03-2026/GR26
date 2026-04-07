package com.smartfnb.supplier.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain Event phát ra khi trạng thái đơn mua hàng thay đổi.
 * Dùng cho Audit Log.
 *
 * @author SmartF&B Team
 * @since 2026-04-07
 */
public record PurchaseOrderStatusChangedEvent(
        UUID purchaseOrderId,
        UUID tenantId,
        UUID branchId,
        String orderNumber,
        String oldStatus,
        String newStatus,
        UUID changedByUserId,
        Instant occurredAt
) {}
