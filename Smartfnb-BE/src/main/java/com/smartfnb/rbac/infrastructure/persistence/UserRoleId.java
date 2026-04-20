package com.smartfnb.rbac.infrastructure.persistence;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

/**
 * Lớp Composite Key cho bảng user_roles.
 * Tránh lỗi SchemaManagementException: missing column [id].
 * 
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleId implements Serializable {
    private UUID userId;
    private UUID roleId;
}
