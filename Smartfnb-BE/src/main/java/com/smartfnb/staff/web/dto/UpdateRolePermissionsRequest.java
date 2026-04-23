package com.smartfnb.staff.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * Request DTO cập nhật ma trận permissions cho một role.
 * Dùng replace-all: toàn bộ permissions cũ bị thay thế bằng danh sách mới.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record UpdateRolePermissionsRequest(
        @NotNull(message = "Danh sách permissions không được null (có thể là mảng rỗng)")
        List<String> permissionIds
) {}
