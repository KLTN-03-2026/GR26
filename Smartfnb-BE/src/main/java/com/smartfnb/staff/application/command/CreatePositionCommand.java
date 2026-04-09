package com.smartfnb.staff.application.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Lệnh tạo chức vụ mới trong tenant.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record CreatePositionCommand(
        /** UUID tenant — lấy từ TenantContext */
        UUID tenantId,
        /** Tên chức vụ — unique trong tenant */
        @NotBlank
        @Size(max = 100)
        String name,
        /** Mô tả chức vụ (nullable) */
        @Size(max = 255)
        String description
) {}
