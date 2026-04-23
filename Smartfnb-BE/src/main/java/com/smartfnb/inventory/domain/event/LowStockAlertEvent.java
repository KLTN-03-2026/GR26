package com.smartfnb.inventory.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Phát ra khi tồn kho nguyên liệu xuống dưới ngưỡng cảnh báo (min_level).
 * Consumer: NotificationModule → gửi cảnh báo cho Branch Manager.
 *
 * <p>Triggered sau mỗi thao tác trừ kho (SALE_DEDUCT, WASTE, ADJUSTMENT giảm).</p>
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
public record LowStockAlertEvent(
    UUID branchId,
    UUID tenantId,
    UUID itemId,
    String itemName,
    double currentQuantity,
    double threshold,
    String unit,
    Instant occurredAt
) {}
