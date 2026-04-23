package com.smartfnb.staff.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * Request DTO gán roles cho nhân viên.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record AssignRolesRequest(
        @NotNull(message = "Danh sách role IDs không được null")
        List<UUID> roleIds
) {}
