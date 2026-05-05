package com.smartfnb.shift.application.command;

import java.util.UUID;

/**
 * Lệnh xoá đăng ký ca làm việc.
 */
public record DeleteShiftScheduleCommand(
        UUID tenantId,
        UUID branchId,
        UUID currentUserId,
        boolean isStaffRole,
        UUID scheduleId
) {}
