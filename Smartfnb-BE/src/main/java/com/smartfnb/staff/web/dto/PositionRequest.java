package com.smartfnb.staff.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

/**
 * Request DTO tạo / cập nhật chức vụ.
 *
 * @author vutq
 * @since 2026-04-06
 */
public record PositionRequest(
        @NotBlank(message = "Tên chức vụ không được để trống")
        @Size(max = 100, message = "Tên chức vụ tối đa 100 ký tự")
        String name,

        @Size(max = 255)
        String description,

        @PositiveOrZero(message = "Lương cơ bản không được âm")
        BigDecimal baseSalary
) {}
