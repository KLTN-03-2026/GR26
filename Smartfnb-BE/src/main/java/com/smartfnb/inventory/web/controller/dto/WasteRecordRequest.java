package com.smartfnb.inventory.web.controller.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request body cho API ghi nhận hao hụt nguyên liệu.
 *
 * @param itemId   UUID nguyên liệu (bắt buộc)
 * @param quantity số lượng hao hụt (phải > 0)
 * @param reason   lý do hao hụt (bắt buộc)
 *
 * @author vutq
 * @since 2026-04-03
 */
public record WasteRecordRequest(
    @NotNull UUID itemId,
    @NotNull @DecimalMin("0.0001") BigDecimal quantity,
    @NotBlank String reason
) {}
