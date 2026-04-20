package com.smartfnb.expense.application.query;

import java.util.UUID;

public record SearchExpensesQuery(
    UUID tenantId,
    UUID branchId,
    String categoryName,
    int page,
    int size
) {}
