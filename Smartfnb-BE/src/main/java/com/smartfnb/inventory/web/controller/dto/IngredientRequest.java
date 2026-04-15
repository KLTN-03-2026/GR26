package com.smartfnb.inventory.web.controller.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO yêu cầu nguyên liệu trong mẻ sản xuất.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Schema(description = "Thông tin nguyên liệu tiêu thụ trong mẻ sản xuất")
public record IngredientRequest(
    
    @Schema(description = "ID nguyên liệu tiêu thụ", example = "550e8400-e29b-41d4-a716-446655440002")
    @NotNull(message = "ID nguyên liệu không được để trống")
    UUID itemId,

    @Schema(description = "Số lượng tiêu thụ", example = "0.5")
    @NotNull(message = "Số lượng không được để trống")
    @DecimalMin(value = "0.0001", message = "Số lượng tiêu thụ phải lớn hơn 0")
    BigDecimal quantity
) {}
