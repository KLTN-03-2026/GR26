package com.smartfnb.order.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO request cập nhật khu vực bàn.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record UpdateTableZoneRequest(

        /** Tên khu vực mới */
        @NotBlank(message = "Tên khu vực không được để trống")
        @Size(max = 100, message = "Tên khu vực tối đa 100 ký tự")
        String name,

        /** Số tầng mới */
        @Min(value = 1, message = "Số tầng phải >= 1")
        Integer floorNumber
) {}
