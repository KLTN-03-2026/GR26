package com.smartfnb.report.application.query;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Query: Lấy heatmap doanh thu theo giờ.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public record GetHourlyRevenueHeatmapQuery(
    UUID branchId,
    LocalDate date
) {
}
