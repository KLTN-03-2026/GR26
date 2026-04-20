package com.smartfnb.shift.application.command;

import jakarta.validation.constraints.*;

import java.time.LocalTime;
import java.util.UUID;

/**
 * Command cập nhật ca mẫu (shift template) (S-16).
 *
 * @param tenantId    UUID tenant (từ TenantContext)
 * @param templateId  UUID ca mẫu cần cập nhật
 * @param updatedBy   UUID người cập nhật
 * @param name        Tên ca mới (nullable = không thay đổi)
 * @param startTime   Giờ bắt đầu mới
 * @param endTime     Giờ kết thúc mới
 * @param minStaff    Số NV tối thiểu mới
 * @param maxStaff    Số NV tối đa mới
 * @param color       Màu hex mới
 * @param active      Trạng thái active (true/false)
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record UpdateShiftTemplateCommand(
        @NotNull UUID tenantId,
        @NotNull UUID templateId,
        @NotNull UUID updatedBy,
        @NotBlank String name,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @Min(1) int minStaff,
        @Min(1) int maxStaff,
        String color,
        boolean active
) {}
