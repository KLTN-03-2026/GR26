package com.smartfnb.shared;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Lưu trữ thông tin tenant hiện tại trong suốt request lifecycle.
 * Sử dụng InheritableThreadLocal để hỗ trợ child threads kế thừa context.
 * Được populate bởi JwtAuthFilter và xóa trong finally block.
 *
 * <p>Quy tắc: KHÔNG bao giờ lấy tenantId từ request body — luôn dùng class này.</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
public final class TenantContext {

    /** Thread-local lưu tenantId — kế thừa được cho child threads */
    private static final InheritableThreadLocal<UUID> TENANT_ID =
            new InheritableThreadLocal<>();

    /** Thread-local lưu userId của người dùng hiện tại */
    private static final InheritableThreadLocal<UUID> USER_ID =
            new InheritableThreadLocal<>();

    /** Thread-local lưu branchId đang làm việc (có thể null nếu chưa chọn chi nhánh) */
    private static final InheritableThreadLocal<UUID> BRANCH_ID =
            new InheritableThreadLocal<>();

    /** Thread-local lưu role của người dùng hiện tại */
    private static final InheritableThreadLocal<String> ROLE =
            new InheritableThreadLocal<>();

    /** Ngăn khởi tạo — class này chỉ có static methods */
    private TenantContext() {}

    // ============================= TENANT ID ==============================

    /**
     * Thiết lập tenantId cho request hiện tại.
     *
     * @param tenantId UUID của tenant
     */
    public static void setCurrentTenantId(UUID tenantId) {
        TENANT_ID.set(tenantId);
    }

    /**
     * Lấy tenantId đang active. Throw exception nếu chưa set (dùng trong context không auth).
     *
     * @return UUID tenantId
     * @throws SmartFnbException nếu tenantId chưa được thiết lập
     */
    public static UUID requireCurrentTenantId() {
        UUID tenantId = TENANT_ID.get();
        if (tenantId == null) {
            throw new SmartFnbException("TENANT_CONTEXT_MISSING",
                    "TenantId chưa được thiết lập trong context — yêu cầu xác thực JWT trước");
        }
        return tenantId;
    }

    /**
     * Lấy tenantId, trả null nếu chưa set (dùng ở các endpoint public).
     *
     * @return UUID tenantId hoặc null
     */
    public static UUID getCurrentTenantId() {
        return TENANT_ID.get();
    }

    // ============================= USER ID ================================

    /**
     * Thiết lập userId cho request hiện tại.
     *
     * @param userId UUID của user
     */
    public static void setCurrentUserId(UUID userId) {
        USER_ID.set(userId);
    }

    /**
     * Lấy userId đang active.
     *
     * @return UUID userId hoặc null
     */
    public static UUID getCurrentUserId() {
        return USER_ID.get();
    }

    // ============================= BRANCH ID ==============================

    /**
     * Thiết lập branchId đang làm việc.
     *
     * @param branchId UUID của chi nhánh
     */
    public static void setCurrentBranchId(UUID branchId) {
        BRANCH_ID.set(branchId);
    }

    /**
     * Lấy branchId đang làm việc.
     *
     * @return UUID branchId hoặc null nếu chưa chọn chi nhánh
     */
    public static UUID getCurrentBranchId() {
        return BRANCH_ID.get();
    }

    // ============================= ROLE ===================================

    /**
     * Thiết lập role của người dùng hiện tại.
     *
     * @param role tên role (VD: OWNER, CASHIER, BARISTA)
     */
    public static void setCurrentRole(String role) {
        ROLE.set(role);
    }

    /**
     * Lấy role của người dùng hiện tại.
     *
     * @return tên role hoặc null
     */
    public static String getCurrentRole() {
        return ROLE.get();
    }

    // ============================= CLEAR ==================================

    /**
     * Xóa toàn bộ context sau khi request hoàn tất.
     * PHẢI được gọi trong finally block của filter để tránh memory leak.
     */
    public static void clear() {
        TENANT_ID.remove();
        USER_ID.remove();
        BRANCH_ID.remove();
        ROLE.remove();
    }
}
