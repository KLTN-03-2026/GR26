package com.smartfnb.staff.application.command;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * Lệnh gán vai trò cho nhân viên.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record AssignRoleToStaffCommand(
        /** UUID tenant — lấy từ TenantContext */
        @NotNull UUID tenantId,
        /** UUID nhân viên cần gán role */
        @NotNull UUID staffId,
        /** Danh sách UUID roles muốn gán (replace-all) */
        @NotNull List<UUID> roleIds
) {}
