package com.smartfnb.inventory.application.command;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record UpdateThresholdCommand(
    @NotNull UUID tenantId,
    @NotNull UUID branchId,
    @NotNull UUID balanceId,
    @NotNull @DecimalMin("0.0") BigDecimal minLevel
) {}
