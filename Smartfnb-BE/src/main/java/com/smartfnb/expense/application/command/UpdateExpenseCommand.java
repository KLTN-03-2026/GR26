package com.smartfnb.expense.application.command;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record UpdateExpenseCommand(
    UUID id,
    UUID tenantId,
    UUID branchId,
    BigDecimal amount,
    String categoryName,
    String description,
    Instant expenseDate,
    String paymentMethod
) {}
