package com.smartfnb.inventory.application.command;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Command ghi nhận hao hụt nguyên liệu (WASTE).
 * Luôn giảm tồn kho và ghi audit trail.
 *
 * @param tenantId UUID tenant (từ JWT)
 * @param branchId UUID chi nhánh (từ JWT)
 * @param userId   UUID nhân viên ghi nhận
 * @param itemId   UUID nguyên liệu bị hao hụt
 * @param quantity số lượng hao hụt (phải > 0)
 * @param reason   lý do hao hụt (bắt buộc)
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
public record WasteRecordCommand(
    @NotNull UUID tenantId,
    @NotNull UUID branchId,
    @NotNull UUID userId,
    @NotNull UUID itemId,
    @NotNull @DecimalMin("0.0001") BigDecimal quantity,
    @NotBlank String reason
) {}
