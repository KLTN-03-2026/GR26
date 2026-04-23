package com.smartfnb.staff.application.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Lệnh tạo vai trò (Role) mới trong tenant.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record CreateRoleCommand(
        /** UUID tenant — lấy từ TenantContext */
        @NotNull UUID tenantId,
        /** Tên vai trò — unique trong tenant */
        @NotBlank @Size(max = 100) String name,
        /** Mô tả vai trò (nullable) */
        @Size(max = 255) String description
) {}
