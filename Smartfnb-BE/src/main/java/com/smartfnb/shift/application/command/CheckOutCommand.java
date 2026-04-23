package com.smartfnb.shift.application.command;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Command check-out kết thúc ca làm việc (S-16).
 * Chỉ được thực hiện khi shift schedule có status = CHECKED_IN.
 *
 * @param tenantId   UUID tenant
 * @param scheduleId UUID shift schedule
 * @param userId     UUID nhân viên check-out (phải là user_id trong schedule)
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record CheckOutCommand(
        @NotNull UUID tenantId,
        @NotNull UUID scheduleId,
        @NotNull UUID userId
) {}
