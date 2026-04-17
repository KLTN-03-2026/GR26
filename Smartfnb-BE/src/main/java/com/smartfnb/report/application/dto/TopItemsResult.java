package com.smartfnb.report.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Kết quả Top 10 sản phẩm bán chạy theo ngày.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public record TopItemsResult(
    LocalDate date,
    String branchName,
    List<TopItemDto> topItems
) {
    public record TopItemDto(
        UUID itemId,
        String itemName,
        int qtySold,
        BigDecimal revenue,
        BigDecimal grossMargin,
        int rank
    ) {}
}
