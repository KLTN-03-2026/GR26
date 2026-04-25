package com.smartfnb.menu.application.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO request tạo item mới (SELLABLE | INGREDIENT | SUB_ASSEMBLY).
 * tenantId không nhận từ client — lấy từ JWT qua TenantContext.
 * imageUrl không nhận từ đây — nhận qua @RequestPart("image") MultipartFile.
 *
 * @author vutq
 * @since 2026-03-28
 */
public record CreateMenuItemRequest(

        /** ID danh mục — có thể null */
        UUID categoryId,

        /** Tên item — unique trong tenant */
        @NotBlank(message = "Tên không được để trống")
        @Size(max = 255, message = "Tên tối đa 255 ký tự")
        String name,

        /**
         * Loại item: SELLABLE (mặc định) | INGREDIENT | SUB_ASSEMBLY.
         * Nếu không truyền, hệ thống mặc định là SELLABLE.
         */
        @Pattern(regexp = "^(SELLABLE|INGREDIENT|SUB_ASSEMBLY)$",
                 message = "type phải là SELLABLE, INGREDIENT hoặc SUB_ASSEMBLY")
        String type,

        /** Giá bán mặc định — phải >= 0; INGREDIENT/SUB_ASSEMBLY có thể để 0 */
        @NotNull(message = "Giá không được để trống")
        @DecimalMin(value = "0", message = "Giá không được âm")
        BigDecimal basePrice,

        /** Đơn vị tính (ly, kg, g, L...) */
        @Size(max = 30, message = "Đơn vị tính tối đa 30 ký tự")
        String unit,

        /** Đồng bộ lên app giao hàng — chỉ áp dụng cho SELLABLE */
        Boolean isSyncDelivery
) {}
