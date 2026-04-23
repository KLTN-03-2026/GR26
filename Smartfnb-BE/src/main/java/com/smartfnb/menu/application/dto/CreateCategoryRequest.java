package com.smartfnb.menu.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO request tạo danh mục mới.
 * tenantId không nhận từ client — lấy từ JWT qua TenantContext.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record CreateCategoryRequest(

        /** Tên danh mục — bắt buộc, tối đa 100 ký tự */
        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 100, message = "Tên danh mục tối đa 100 ký tự")
        String name,

        /** Mô tả ngắn về danh mục */
        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String description,

        /** Thứ tự hiển thị — mặc định 0 */
        @Min(value = 0, message = "Thứ tự hiển thị không được âm")
        Integer displayOrder
) {}
