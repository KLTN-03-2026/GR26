package com.smartfnb.shift.application.command;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Command xoá (deactivate) ca mẫu (S-16).
 * Xoá mềm: set active = false, không xoá cứng.
 *
 * @param tenantId   UUID tenant
 * @param templateId UUID ca mẫu cần xoá
 * @param deletedBy  UUID người thực hiện
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record DeleteShiftTemplateCommand(
        @NotNull UUID tenantId,
        @NotNull UUID templateId,
        @NotNull UUID deletedBy
) {}
