package com.smartfnb.report.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Kết quả báo cáo doanh thu.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public record RevenueReportResult(
    LocalDate reportDate,       // Ngày báo cáo
    BigDecimal totalRevenue,
    BigDecimal totalGrossProfit,
    int totalOrders,
    BigDecimal avgOrderValue,
    PaymentBreakdownDto paymentBreakdown,
    List<RevenueLineDto> lines  // Chi tiết theo branch (nếu filter all branches)
) {
    public record RevenueLineDto(
        String branchName,
        BigDecimal revenue,
        int orderCount,
        BigDecimal grossProfit,
        PaymentBreakdownDto breakdown
    ) {}
    
    public record PaymentBreakdownDto(
        BigDecimal cash,
        BigDecimal momo,
        BigDecimal vietqr,
        BigDecimal banking,
        BigDecimal other,
        BigDecimal total
    ) {}
}
