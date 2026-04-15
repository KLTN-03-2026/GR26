package com.smartfnb.inventory.web.controller.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO yêu cầu sản xuất bán thành phẩm.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Schema(description = "Yêu cầu sản xuất bán thành phẩm")
public record ProduceSubAssemblyRequest(
    
    @Schema(description = "ID chi nhánh nơi thực hiện sản xuất", example = "550e8400-e29b-41d4-a716-446655440000")
    @NotNull UUID branchId,

    @Schema(description = "ID bán thành phẩm cần sản xuất", example = "550e8400-e29b-41d4-a716-446655440001")
    @NotNull UUID subAssemblyId,

    @Schema(description = "Số lượng dự kiến sản xuất", example = "10.0")
    @NotNull @DecimalMin("0.0001") BigDecimal expectedOutput,

    @Schema(description = "Số lượng thực tế chế biến được", example = "9.5")
    @NotNull @DecimalMin("0.0001") BigDecimal actualOutput,

    @Schema(description = "Ghi chú cho mẻ sản xuất", example = "Sản xuất mẻ bột bánh mì sáng sớm")
    String note
) {}
