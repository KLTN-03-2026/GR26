package com.smartfnb.order.application.dto;

import jakarta.validation.constraints.*;

import java.util.UUID;

/**
 * DTO request tạo bàn mới.
 * branchId lấy từ path variable, tenantId lấy từ JWT.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record CreateTableRequest(

        /** ID zone — null nếu chưa phân khu vực */
        UUID zoneId,

        /** Tên bàn — unique trong (branch, zone) */
        @NotBlank(message = "Tên bàn không được để trống")
        @Size(max = 50, message = "Tên bàn tối đa 50 ký tự")
        String name,

        /** Số chỗ ngồi — phải > 0 */
        @Min(value = 1, message = "Số chỗ ngồi phải >= 1")
        Integer capacity,

        /**
         * Hình dạng bàn trên sơ đồ.
         * Giá trị hợp lệ: square | round
         */
        @Pattern(regexp = "^(square|round)$", message = "Hình dạng bàn phải là 'square' hoặc 'round'")
        String shape
) {}
