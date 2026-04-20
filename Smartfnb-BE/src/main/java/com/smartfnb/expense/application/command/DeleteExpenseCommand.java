package com.smartfnb.expense.application.command;

import java.util.UUID;

public record DeleteExpenseCommand(
    UUID id,
    UUID tenantId,
    UUID branchId
) {}
