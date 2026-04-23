package com.smartfnb.report.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Thống kê hiệu suất sản phẩm theo ngày tại chi nhánh.
 * Bao gồm: Số lượng bán, Doanh thu, Giá vốn, Biên lợi suất.
 *
 * @author vutq
 * @since 2026-04-16
 */
public record DailyItemStat(
    UUID id,
    UUID tenantId,
    UUID branchId,
    UUID itemId,
    String itemName,
    LocalDate date,
    int qtySold,
    BigDecimal revenue,
    BigDecimal cost,
    BigDecimal grossMargin  // Calculated: (revenue - cost) / revenue * 100
) {
    /**
     * Tính lại gross margin = (revenue - cost) / revenue * 100.
     * Công thức: gross_margin = (revenue - cost) / revenue * 100
     */
    public BigDecimal calculateGrossMargin() {
        if (revenue.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return revenue.subtract(cost)
            .divide(revenue, 2, java.math.RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));
    }
}
