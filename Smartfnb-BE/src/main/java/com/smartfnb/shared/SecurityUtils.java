package com.smartfnb.shared;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;
import java.util.UUID;

/**
 * Tiện ích lấy thông tin người dùng hiện tại từ Spring SecurityContext.
 * Dùng trong service layer khi cần biết ai đang thực hiện thao tác.
 *
 * <p>Lưu ý: Ưu tiên dùng TenantContext.getCurrentUserId() nếu đã có,
 * vì nhanh hơn và không cần đọc SecurityContext.</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
public final class SecurityUtils {

    /** Ngăn khởi tạo — class chỉ có static methods */
    private SecurityUtils() {}

    /**
     * Lấy username (email) của người dùng đang đăng nhập.
     *
     * @return Optional chứa username, empty nếu chưa xác thực
     */
    public static Optional<String> getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return Optional.of(userDetails.getUsername());
        }
        if (principal instanceof String username) {
            return Optional.of(username);
        }
        return Optional.empty();
    }

    /**
     * Lấy userId của người dùng đang đăng nhập từ JWT principal.
     * JWT principal được set là userId (UUID string) khi parse token.
     *
     * @return Optional chứa userId UUID, empty nếu chưa xác thực
     */
    public static Optional<UUID> getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }

        try {
            // JWT principal là userId string
            String subject = auth.getName();
            return Optional.of(UUID.fromString(subject));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    /**
     * Kiểm tra người dùng hiện tại có đang được xác thực không.
     *
     * @return true nếu đã xác thực
     */
    public static boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal());
    }

    /**
     * Kiểm tra người dùng hiện tại có mang role cho trước không.
     *
     * @param role tên role (VD: ROLE_OWNER)
     * @return true nếu có role
     */
    public static boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(role));
    }
}
