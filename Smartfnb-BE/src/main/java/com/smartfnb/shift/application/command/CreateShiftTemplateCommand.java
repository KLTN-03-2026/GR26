package com.smartfnb.shift.application.command;

import jakarta.validation.constraints.*;

import java.time.LocalTime;
import java.util.UUID;

/**
 * Command tạo ca mẫu (shift template) cho chi nhánh (S-16).
 *
 * @param tenantId  UUID tenant (lấy từ TenantContext)
 * @param branchId  UUID chi nhánh
 * @param createdBy UUID người tạo
 * @param name      Tên ca (VD: "Ca sáng 6h-14h")
 * @param startTime Giờ bắt đầu ca
 * @param endTime   Giờ kết thúc ca (phải sau startTime)
 * @param minStaff  Số nhân viên tối thiểu (≥ 1)
 * @param maxStaff  Số nhân viên tối đa (≥ minStaff)
 * @param color     Màu hex cho UI calendar (tuỳ chọn, VD: "#FF5733")
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record CreateShiftTemplateCommand(
        @NotNull UUID tenantId,
        @NotNull UUID branchId,
        @NotNull UUID createdBy,
        @NotBlank String name,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @Min(1) int minStaff,
        @Min(1) int maxStaff,
        String color
) {}
