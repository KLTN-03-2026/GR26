package com.smartfnb.report.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Kết quả heatmap doanh thu theo giờ.
 * Dùng để render biểu đồ: trục X là giờ (0-23), trục Y là doanh thu/số đơn.
 *
 * @author vutq
 * @since 2026-04-16
 */
public record HourlyRevenueHeatmapResult(
    LocalDate date,
    String branchName,
    List<HourlyDataDto> hourlyData
) {
    public record HourlyDataDto(
        int hour,
        int orderCount,
        BigDecimal revenue,
        BigDecimal avgOrderValue
    ) {}
}
