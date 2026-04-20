package com.smartfnb.report.domain.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Domain Event: Báo cáo doanh thu đã được cập nhật.
 * Consumer: Dashboard, Analytics module.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public record RevenueReportUpdatedEvent(
    UUID tenantId,
    UUID branchId,
    java.time.LocalDate date,
    BigDecimal totalRevenue,
    int orderCount,
    BigDecimal grossProfit,
    Instant occurredAt
) {
}
