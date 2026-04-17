package com.smartfnb.expense.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ExpenseResponse(
    UUID id,
    BigDecimal amount,
    String categoryName,
    String description,
    Instant expenseDate,
    String paymentMethod,
    String status,
    UUID createdBy,
    Instant createdAt
) {}
