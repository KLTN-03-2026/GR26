package com.smartfnb.menu.application.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO request cập nhật item (SELLABLE | INGREDIENT | SUB_ASSEMBLY).
 * imageUrl không nhận từ đây — nhận qua @RequestPart("image") MultipartFile.
 * Nếu không upload ảnh mới thì giữ nguyên ảnh cũ.
 * type KHÔNG được phép thay đổi sau khi tạo — bỏ qua nếu FE gửi lên.
 *
 * @author vutq
 * @since 2026-03-28
 */
public record UpdateMenuItemRequest(

        /** ID danh mục mới — null để bỏ khỏi danh mục */
        UUID categoryId,

        /** Tên item mới */
        @NotBlank(message = "Tên không được để trống")
        @Size(max = 255, message = "Tên tối đa 255 ký tự")
        String name,

        /** Giá bán mới — chỉ áp dụng cho SELLABLE */
        @NotNull(message = "Giá không được để trống")
        @DecimalMin(value = "0", message = "Giá không được âm")
        BigDecimal basePrice,

        /** Đơn vị tính mới */
        @Size(max = 30, message = "Đơn vị tính tối đa 30 ký tự")
        String unit,

        /** Trạng thái kích hoạt */
        Boolean isActive,

        /** Đồng bộ lên app giao hàng */
        Boolean isSyncDelivery
) {}
