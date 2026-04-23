package com.smartfnb.staff.application.command;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * Lệnh cập nhật ma trận permission cho một vai trò (S-15 — RBAC matrix).
 * QUAN TRỌNG: Thao tác này ghi audit_log bắt buộc.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record UpdateRolePermissionsCommand(
        /** UUID tenant — lấy từ TenantContext */
        @NotNull UUID tenantId,
        /** UUID người thực hiện — lấy từ TenantContext */
        @NotNull UUID performedByUserId,
        /** UUID vai trò cần cập nhật */
        @NotNull UUID roleId,
        /** Danh sách permission IDs mới (replace toàn bộ — VD: ["STAFF_VIEW", "ORDER_CREATE"]) */
        @NotNull List<String> permissionIds
) {}
