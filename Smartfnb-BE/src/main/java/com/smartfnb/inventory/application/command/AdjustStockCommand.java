package com.smartfnb.inventory.application.command;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Command điều chỉnh kho thủ công — set giá trị tuyệt đối mới.
 * Bắt buộc ghi audit_log với lý do theo CODING_GUIDELINES.
 *
 * @param tenantId    UUID tenant (từ JWT)
 * @param branchId    UUID chi nhánh (từ JWT)
 * @param userId      UUID nhân viên thực hiện (từ JWT)
 * @param itemId      UUID nguyên liệu cần điều chỉnh
 * @param newQuantity số lượng mới (tuyệt đối, >= 0)
 * @param reason      lý do điều chỉnh (bắt buộc)
 *
 * @author vutq
 * @since 2026-04-03
 */
public record AdjustStockCommand(
    @NotNull UUID tenantId,
    @NotNull UUID branchId,
    @NotNull UUID userId,
    @NotNull UUID itemId,
    @NotNull @DecimalMin("0.0") BigDecimal newQuantity,
    @NotBlank String reason
) {}
