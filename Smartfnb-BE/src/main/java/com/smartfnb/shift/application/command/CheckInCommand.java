package com.smartfnb.shift.application.command;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Command check-in bắt đầu ca làm việc (S-16).
 * Chỉ được thực hiện khi shift schedule có status = SCHEDULED.
 *
 * @param tenantId   UUID tenant
 * @param scheduleId UUID shift schedule
 * @param userId     UUID nhân viên check-in (phải là user_id trong schedule)
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record CheckInCommand(
        @NotNull UUID tenantId,
        @NotNull UUID scheduleId,
        @NotNull UUID userId
) {}
