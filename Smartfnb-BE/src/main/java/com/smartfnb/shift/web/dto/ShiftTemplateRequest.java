package com.smartfnb.shift.web.dto;

import jakarta.validation.constraints.*;

import java.time.LocalTime;

/**
 * Request DTO tạo / cập nhật ca mẫu (S-16).
 *
 * @param name      Tên ca (VD: "Ca sáng 6h-14h")
 * @param startTime Giờ bắt đầu ca (HH:mm)
 * @param endTime   Giờ kết thúc ca (HH:mm)
 * @param minStaff  Số NV tối thiểu cần cho ca
 * @param maxStaff  Số NV tối đa cho phép trong ca
 * @param color     Màu hex cho UI (#FF5733)
 * @param active    Trạng thái active (mặc định true khi tạo)
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record ShiftTemplateRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @Min(1) int minStaff,
        @Min(1) int maxStaff,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Màu phải ở dạng hex #RRGGBB")
        String color,
        boolean active
) {}
