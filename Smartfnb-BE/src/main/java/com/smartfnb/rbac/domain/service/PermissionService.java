package com.smartfnb.rbac.domain.service;

import com.smartfnb.rbac.infrastructure.persistence.PermissionRepository;
import com.smartfnb.rbac.infrastructure.persistence.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Domain Service tải thông tin phân quyền của người dùng từ DB.
 * Kết quả được cache để tránh query lặp lại cho cùng userId+tenantId.
 *
 * <p>Dùng bởi:</p>
 * <ul>
 *   <li>{@code LoginCommandHandler} — nhúng permissions vào JWT claim</li>
 *   <li>{@code RegisterTenantCommandHandler} — nhúng permissions vào JWT ngay sau đăng ký</li>
 *   <li>{@code CustomPermissionEvaluator} — kiểm tra quyền runtime</li>
 * </ul>
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final RoleRepository       roleRepository;

    /**
     * Tải danh sách permission codes của user trong một tenant.
     * Kết quả có thể cache — sẽ invalidate khi admin thay đổi phân quyền.
     *
     * @param userId   UUID người dùng
     * @param tenantId UUID tenant
     * @return danh sách mã quyền đã sắp xếp (VD: ["ORDER_CREATE", "PAYMENT_VIEW"])
     */
    @Transactional(readOnly = true)
    public List<String> getPermissionCodes(UUID userId, UUID tenantId) {
        List<String> codes = permissionRepository
                .findPermissionCodesByUserAndTenant(userId, tenantId);
        log.debug("Tải {} quyền cho userId={} tenantId={}", codes.size(), userId, tenantId);
        return codes;
    }

    /**
     * Tải danh sách tên role của user trong tenant.
     * User có thể có nhiều role đồng thời.
     *
     * @param userId   UUID người dùng
     * @param tenantId UUID tenant
     * @return danh sách tên role (VD: ["OWNER", "MANAGER"])
     */
    @Transactional(readOnly = true)
    public List<String> getRoleNames(UUID userId, UUID tenantId) {
        return permissionRepository.findRoleNamesByUserAndTenant(userId, tenantId);
    }

    /**
     * Kiểm tra user có quyền cụ thể trong tenant không.
     * Dùng trong CustomPermissionEvaluator để kiểm tra runtime.
     *
     * @param userId         UUID người dùng
     * @param tenantId       UUID tenant
     * @param permissionCode mã quyền cần kiểm tra (VD: ORDER_CREATE)
     * @return true nếu user có quyền này
     */
    @Transactional(readOnly = true)
    public boolean hasPermission(UUID userId, UUID tenantId, String permissionCode) {
        return getPermissionCodes(userId, tenantId).contains(permissionCode);
    }
}
