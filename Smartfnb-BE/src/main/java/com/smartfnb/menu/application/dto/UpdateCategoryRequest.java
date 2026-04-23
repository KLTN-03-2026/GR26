package com.smartfnb.menu.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO request cập nhật danh mục.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record UpdateCategoryRequest(

        /** Tên danh mục mới */
        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 100, message = "Tên danh mục tối đa 100 ký tự")
        String name,

        /** Mô tả mới */
        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String description,

        /** Thứ tự hiển thị mới */
        @Min(value = 0, message = "Thứ tự hiển thị không được âm")
        Integer displayOrder,

        /** Trạng thái kích hoạt — false sẽ cascade deactivate tất cả MenuItem */
        Boolean isActive
) {}
