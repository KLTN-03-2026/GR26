package com.smartfnb.staff.application.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Lệnh cập nhật chức vụ.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record UpdatePositionCommand(
        UUID tenantId,
        UUID positionId,
        @NotBlank @Size(max = 100) String name,
        @Size(max = 255) String description,
        Boolean active
) {}
