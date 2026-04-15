package com.smartfnb.inventory.web.controller.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO yêu cầu sản xuất mặt hàng.
 * Chứa thông tin mặt hàng đầu ra và danh sách nguyên liệu tiêu thụ thực tế.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Schema(description = "Yêu cầu sản xuất mặt hàng (Production flow)")
public record ProduceItemRequest(
    
    @Schema(description = "ID chi nhánh thực hiện sản xuất", example = "550e8400-e29b-41d4-a716-446655440000")
    @NotNull(message = "ID chi nhánh không được để trống")
    UUID branchId,

    @Schema(description = "ID mặt hàng đầu ra (thành phẩm/bán thành phẩm)", example = "550e8400-e29b-41d4-a716-446655440001")
    @NotNull(message = "ID mặt hàng đầu ra không được để trống")
    UUID outputItemId,

    @Schema(description = "Số lượng sản xuất thực tế", example = "10.0")
    @NotNull(message = "Số lượng sản xuất không được để trống")
    @DecimalMin(value = "0.0001", message = "Số lượng sản xuất phải lớn hơn 0")
    BigDecimal quantity,

    @Schema(description = "Danh sách nguyên liệu tiêu thụ thực tế")
    @NotEmpty(message = "Danh sách nguyên liệu không được để trống")
    @Valid
    List<IngredientRequest> ingredients,

    @Schema(description = "Ghi chú mẻ sản xuất", example = "Sản xuất mẻ bánh mì ngày 2026-04-16")
    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    String note
) {}
