package com.smartfnb.shift.application.command;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Lệnh cập nhật đăng ký ca làm việc.
 */
public record UpdateShiftScheduleCommand(
        UUID tenantId,
        UUID branchId,
        UUID currentUserId,
        boolean isStaffRole,
        UUID scheduleId,
        @NotNull UUID userId,
        @NotNull UUID shiftTemplateId,
        @NotNull LocalDate date
) {}
