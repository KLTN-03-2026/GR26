package com.smartfnb.rbac.infrastructure.persistence;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

/**
 * Lớp Composite Key cho bảng role_permissions.
 * Tránh lỗi SchemaManagementException: missing column [id].
 * 
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RolePermissionId implements Serializable {
    private UUID roleId;
    private String permissionId; // Type String theo VARCHAR(60) ở bảng permissions
}
