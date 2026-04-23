package com.smartfnb.inventory.web.controller.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request body cho API điều chỉnh kho thủ công.
 *
 * @param itemId      UUID nguyên liệu (bắt buộc)
 * @param newQuantity số lượng tuyệt đối mới (>= 0)
 * @param reason      lý do điều chỉnh (bắt buộc — audit requirement)
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
public record AdjustStockRequest(
    @NotNull UUID itemId,
    @NotNull @DecimalMin("0.0") BigDecimal newQuantity,
    @NotBlank String reason
) {}
