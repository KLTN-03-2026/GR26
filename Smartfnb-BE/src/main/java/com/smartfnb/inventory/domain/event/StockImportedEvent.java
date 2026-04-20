package com.smartfnb.inventory.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Phát ra khi nhập kho thành công (tạo batch mới).
 * Consumer: ReportModule cập nhật báo cáo kho, SupplierModule tracking.
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
public record StockImportedEvent(
    UUID batchId,
    UUID tenantId,
    UUID branchId,
    UUID itemId,
    String itemName,
    double quantityImported,
    double costPerUnit,
    UUID importedByUserId,
    Instant occurredAt
) {}
