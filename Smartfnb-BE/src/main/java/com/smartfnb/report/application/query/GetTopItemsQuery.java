package com.smartfnb.report.application.query;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Query: Lấy Top 10 sản phẩm bán chạy.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public record GetTopItemsQuery(
    UUID branchId,
    LocalDate date,
    int limit
) {
}
