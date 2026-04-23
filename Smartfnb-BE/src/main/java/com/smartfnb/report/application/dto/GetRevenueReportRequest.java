package com.smartfnb.report.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Request để lấy báo cáo doanh thu.
 * Hỗ trợ filter: branch, date range, group by.
 *
 * @author vutq
 * @since 2026-04-16
 */
public record GetRevenueReportRequest(
    LocalDate startDate,
    LocalDate endDate,
    UUID branchId,              // Optional: null = all branches user có quyền xem
    String groupBy              // daily | weekly | monthly
) {
}
