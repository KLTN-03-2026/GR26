package com.smartfnb.staff.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * Request DTO tạo vai trò mới.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record CreateRoleRequest(
        @NotBlank(message = "Tên vai trò không được để trống")
        @Size(max = 100)
        String name,

        @Size(max = 255)
        String description
) {}
