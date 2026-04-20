package com.smartfnb.order.application.dto;

import jakarta.validation.constraints.*;

import java.util.UUID;

/**
 * DTO request cập nhật bàn.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record UpdateTableRequest(

        /** ID zone mới — null để bỏ khỏi zone */
        UUID zoneId,

        /** Tên bàn mới */
        @NotBlank(message = "Tên bàn không được để trống")
        @Size(max = 50, message = "Tên bàn tối đa 50 ký tự")
        String name,

        /** Số chỗ ngồi mới */
        @Min(value = 1, message = "Số chỗ ngồi phải >= 1")
        Integer capacity,

        /** Hình dạng bàn mới */
        @Pattern(regexp = "^(square|round)$", message = "Hình dạng bàn phải là 'square' hoặc 'round'")
        String shape,

        /** Trạng thái kích hoạt */
        Boolean isActive
) {}
