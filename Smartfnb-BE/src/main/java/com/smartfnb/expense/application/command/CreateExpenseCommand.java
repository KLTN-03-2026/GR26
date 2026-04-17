package com.smartfnb.expense.application.command;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CreateExpenseCommand(
    UUID tenantId,
    UUID branchId,
    BigDecimal amount,
    String categoryName,
    String description,
    Instant expenseDate,
    String paymentMethod,
    UUID createdBy
) {}
