package com.smartfnb.staff.application.query;

import com.smartfnb.staff.infrastructure.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Handler truy vấn ma trận Role-Permission toàn tenant (S-15).
 * READ ONLY — không @Transactional.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
public class GetRolePermissionMatrixQueryHandler {

    private final StaffRoleJpaRepository           roleJpaRepository;
    private final StaffRolePermissionJpaRepository rolePermissionJpaRepository;
    private final StaffPermissionJpaRepository     permissionJpaRepository;

    /**
     * Lấy toàn bộ ma trận role-permission của tenant.
     * Kết quả chứa: danh sách roles + permissions được gán cho mỗi role.
     *
     * @param tenantId UUID tenant hiện tại
     * @return RolePermissionMatrixResult
     */
    public RolePermissionMatrixResult handle(UUID tenantId) {
        // 1. Tất cả roles của tenant
        List<RoleJpaEntity> roles = roleJpaRepository.findByTenantId(tenantId);

        // 2. Với mỗi role, lấy danh sách permissionIds
        List<RolePermissionMatrixResult.RoleDetail> roleDetails = roles.stream()
                .map(role -> {
                    List<String> permIds = rolePermissionJpaRepository
                            .findPermissionIdsByRoleId(role.getId());
                    return new RolePermissionMatrixResult.RoleDetail(
                            role.getId(), role.getName(), role.getDescription(), permIds);
                })
                .toList();

        // 3. Tất cả permissions trong hệ thống (seed data)
        List<RolePermissionMatrixResult.PermissionInfo> allPerms = permissionJpaRepository
                .findAll().stream()
                .map(p -> new RolePermissionMatrixResult.PermissionInfo(
                        p.getId(), p.getModule(), p.getDescription()))
                .toList();

        return new RolePermissionMatrixResult(roleDetails, allPerms);
    }
}
