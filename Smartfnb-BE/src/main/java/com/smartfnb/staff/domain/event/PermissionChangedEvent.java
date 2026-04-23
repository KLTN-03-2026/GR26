package com.smartfnb.staff.domain.event;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Domain event phát ra khi phân quyền vai trò thay đổi.
 * Consumer: AuditModule ghi audit_log, AuthModule cập nhật cache permissions.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record PermissionChangedEvent(
        /** UUID tenant */
        UUID tenantId,
        /** UUID vai trò bị thay đổi */
        UUID roleId,
        /** Tên vai trò */
        String roleName,
        /** UUID người thực hiện thay đổi */
        UUID changedByUserId,
        /** Danh sách permission trước khi thay đổi */
        List<String> oldPermissions,
        /** Danh sách permission sau khi thay đổi */
        List<String> newPermissions,
        /** Thời điểm xảy ra sự kiện */
        Instant occurredAt
) {}
