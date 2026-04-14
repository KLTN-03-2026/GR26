package com.smartfnb.inventory.web.controller.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Request DTO cho việc cập nhật ngưỡng cảnh báo tồn kho.
 */
public record UpdateThresholdRequest(
    @NotNull(message = "Định mức tối thiểu không được để trống")
    @DecimalMin(value = "0.0", message = "Định mức tối thiểu phải lớn hơn hoặc bằng 0")
    BigDecimal minLevel
) {}
