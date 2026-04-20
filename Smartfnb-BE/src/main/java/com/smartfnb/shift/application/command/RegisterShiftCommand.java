package com.smartfnb.shift.application.command;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Command đăng ký ca làm việc cho nhân viên (S-16).
 * Validate: nhân viên không được đăng ký trùng ca (cùng template + ngày).
 *
 * @param tenantId        UUID tenant
 * @param branchId        UUID chi nhánh
 * @param registeredBy    UUID người đăng ký (manager hoặc chính nhân viên)
 * @param userId          UUID nhân viên được gán ca
 * @param shiftTemplateId UUID ca mẫu
 * @param date            Ngày làm việc
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record RegisterShiftCommand(
        @NotNull UUID tenantId,
        @NotNull UUID branchId,
        @NotNull UUID registeredBy,
        @NotNull UUID userId,
        @NotNull UUID shiftTemplateId,
        @NotNull LocalDate date
) {}
