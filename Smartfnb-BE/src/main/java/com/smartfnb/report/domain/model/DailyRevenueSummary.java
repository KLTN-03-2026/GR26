package com.smartfnb.report.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Bản ghi doanh thu hàng ngày theo chi nhánh.
 * Được cập nhật bởi RevenueReportScheduler từ sự kiện OrderCompletedEvent.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public record DailyRevenueSummary(
    UUID id,
    UUID tenantId,
    UUID branchId,
    LocalDate date,
    BigDecimal totalRevenue,
    int totalOrders,
    BigDecimal avgOrderValue,
    PaymentBreakdown paymentBreakdown,
    BigDecimal costOfGoods,
    BigDecimal grossProfit
) {
    /**
     * Cấu trúc breakdown thanh toán theo hình thức.
     * VD: {"CASH": 1000000, "MOMO": 500000, "VIETQR": 800000}
     */
    public record PaymentBreakdown(
        BigDecimal cash,
        BigDecimal momo,
        BigDecimal vietqr,
        BigDecimal banking,
        BigDecimal other
    ) {
        public BigDecimal total() {
            return cash.add(momo).add(vietqr).add(banking).add(other);
        }
    }

    /**
     * Tính gross profit = total revenue - cost of goods.
     * Công thức: gross_profit = total_revenue - cost_of_goods
     * Nên được generated ALWAYS AS trong database, nhưng có thể tính lại tại ứng dụng.
     */
    public BigDecimal calculateGrossProfit() {
        return totalRevenue.subtract(costOfGoods);
    }
}
