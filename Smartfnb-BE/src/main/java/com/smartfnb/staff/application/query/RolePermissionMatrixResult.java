package com.smartfnb.staff.application.query;

import java.util.List;
import java.util.UUID;

/**
 * Kết quả ma trận Role-Permission cho một tenant.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record RolePermissionMatrixResult(
        /** Danh sách tất cả roles trong tenant */
        List<RoleDetail> roles,
        /** Danh sách tất cả permissions trong hệ thống */
        List<PermissionInfo> allPermissions
) {
    /**
     * Thông tin một role kèm permissions được gán.
     */
    public record RoleDetail(
            UUID id,
            String name,
            String description,
            /** Danh sách permission IDs được gán cho role này */
            List<String> permissionIds
    ) {}

    /**
     * Thông tin một permission.
     */
    public record PermissionInfo(
            String id,
            String module,
            String description
    ) {}
}
