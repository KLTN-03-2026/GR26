package com.smartfnb.rbac.security;

import com.smartfnb.rbac.domain.service.PermissionService;
import com.smartfnb.shared.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.UUID;

/**
 * Custom PermissionEvaluator cho Spring Security.
 * Cho phép dùng @PreAuthorize("hasPermission(null, 'ORDER_CREATE')") trong Controllers.
 *
 * <p>Cách hoạt động:</p>
 * <ol>
 *   <li>Spring gọi hasPermission() khi gặp annotation @PreAuthorize</li>
 *   <li>Lấy userId từ Authentication.getName() (được set trong JwtAuthFilter)</li>
 *   <li>Lấy tenantId từ TenantContext (được set trong JwtAuthFilter)</li>
 *   <li>Gọi PermissionService.hasPermission() để check DB</li>
 * </ol>
 *
 * <p>Ví dụ sử dụng trong Controller:</p>
 * <pre>{@code
 * @PreAuthorize("hasPermission(null, 'ORDER_CREATE')")
 * public ResponseEntity<?> createOrder(...) { ... }
 *
 * @PreAuthorize("hasRole('OWNER') or hasPermission(null, 'BRANCH_EDIT')")
 * public ResponseEntity<?> editBranch(...) { ... }
 * }</pre>
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private final PermissionService permissionService;

    /**
     * Kiểm tra quyền của người dùng hiện tại.
     * targetDomainObject thường là null trong SmartF&B (dùng permission code thay thế).
     *
     * @param authentication     Spring Authentication object (principal = userId string)
     * @param targetDomainObject đối tượng tài nguyên — null trong phần lớn trường hợp
     * @param permission         mã quyền cần kiểm tra (VD: "ORDER_CREATE")
     * @return true nếu user có quyền này trong tenant hiện tại
     */
    @Override
    public boolean hasPermission(Authentication authentication,
                                  Object targetDomainObject,
                                  Object permission) {
        if (!isAuthenticatedProperly(authentication)) {
            return false;
        }

        String permissionCode = permission.toString();
        UUID    tenantId       = TenantContext.getCurrentTenantId();
        UUID    userId         = parseUserId(authentication);

        if (tenantId == null || userId == null) {
            log.warn("Thiếu tenantId hoặc userId trong context — từ chối quyền {}", permissionCode);
            return false;
        }

        boolean granted = permissionService.hasPermission(userId, tenantId, permissionCode);
        log.debug("hasPermission({}, {}) = {}", userId, permissionCode, granted);
        return granted;
    }

    /**
     * Kiểm tra quyền trên một targetId cụ thể (VD: kiểm tra quyền trên orderId).
     * Hiện tại delegate về method chính — có thể mở rộng sau.
     *
     * @param authentication Spring Authentication
     * @param targetId       ID của tài nguyên cụ thể
     * @param targetType     tên class của tài nguyên (VD: "Order")
     * @param permission     mã quyền
     * @return true nếu user có quyền
     */
    @Override
    public boolean hasPermission(Authentication authentication,
                                  Serializable targetId,
                                  String targetType,
                                  Object permission) {
        return hasPermission(authentication, targetId, permission);
    }

    // ========================== PRIVATE ==========================

    /**
     * Kiểm tra authentication có hợp lệ không.
     *
     * @param auth Spring Authentication
     * @return true nếu đã xác thực và không phải anonymous
     */
    private boolean isAuthenticatedProperly(Authentication auth) {
        return auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal());
    }

    /**
     * Parse userId từ Authentication.getName() (principal = UUID string).
     *
     * @param auth Spring Authentication
     * @return UUID userId hoặc null nếu parse lỗi
     */
    private UUID parseUserId(Authentication auth) {
        try {
            return UUID.fromString(auth.getName());
        } catch (IllegalArgumentException e) {
            log.warn("Không thể parse userId từ authentication: {}", auth.getName());
            return null;
        }
    }
}
