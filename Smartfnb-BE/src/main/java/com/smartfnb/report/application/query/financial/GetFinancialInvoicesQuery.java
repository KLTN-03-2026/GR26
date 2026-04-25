package com.smartfnb.report.application.query.financial;

import lombok.Builder;
import java.time.LocalDate;
import java.util.UUID;

@Builder
public record GetFinancialInvoicesQuery(
    UUID tenantId,
    UUID branchId,
    LocalDate startDate,
    LocalDate endDate,
    int page,
    int pageSize
) {
}
