package com.smartfnb.report.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Thống kê doanh thu theo giờ của ngày.
 * Dùng để render heatmap: trục X là giờ (0-23), trục Y là giá trị doanh thu/số đơn.
 *
 * @author vutq
 * @since 2026-04-16
 */
public record HourlyRevenueStat(
    UUID id,
    UUID branchId,
    LocalDate date,
    int hour,       // 0-23
    int orderCount,
    BigDecimal revenue
) {
}
