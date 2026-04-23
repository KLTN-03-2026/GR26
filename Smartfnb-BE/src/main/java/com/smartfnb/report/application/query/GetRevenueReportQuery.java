package com.smartfnb.report.application.query;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Query: Lấy báo cáo doanh thu.
 *
 * @author vutq
 * @since 2026-04-16
 */
public record GetRevenueReportQuery(
    UUID tenantId,
    UUID branchId,              // Optional: null = all branches
    LocalDate startDate,
    LocalDate endDate,
    String groupBy              // daily | weekly | monthly
) {
}
