package com.smartfnb.plan.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Map;

/**
 * Request DTO để tạo/cập nhật gói dịch vụ.
 */
public record PlanRequest(
        @NotBlank(message = "Tên gói không được để trống") String name,
        @NotBlank(message = "Slug gói không được để trống") String slug,
        @NotNull(message = "Giá gói không được để trống") @Min(value = 0, message = "Giá không được nhỏ hơn 0") BigDecimal priceMonthly,
        @Min(value = 0, message = "Số lượng chi nhánh tối thiểu là 0") Integer maxBranches,
        @Min(value = 0, message = "Số lượng nhân viên tối thiểu là 0") Integer maxStaff,
        @Min(value = 0, message = "Số lượng món ăn tối thiểu là 0") Integer maxMenuItems,
        Map<String, Boolean> features,
        boolean isActive
) {}
