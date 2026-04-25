package com.smartfnb.report.infrastructure.config;

/**
 * Cache name constants cho S-19 Reports module.
 *
 * <p>Tất cả {@code @Cacheable}, {@code @CacheEvict}, cache config và listener phải tham chiếu
 * constants ở đây thay vì dùng string literal để tránh lỗi typo gây lỗi 500 (cache not found).
 *
 * <p>Convention: {@code <domain>:<resource>} — khớp với {@link ReportCacheConfig}.
 *
 * @author vutq
 * @since 2026-04-25
 */
public final class ReportCacheNames {

    private ReportCacheNames() {
        // utility class — no instantiation
    }

    // ======================== INVENTORY ========================

    /** Tồn kho hiện tại theo chi nhánh. */
    public static final String INVENTORY_STOCK         = "inventory:stock";

    /** Items sắp hết hạn (expiring items). */
    public static final String INVENTORY_EXPIRING      = "inventory:expiring-items";

    /** Biến động kho theo kỳ (movement tracking). */
    public static final String INVENTORY_MOVEMENT      = "inventory:movement";

    /** Hao hụt (waste report). */
    public static final String INVENTORY_WASTE         = "inventory:waste";

    /** Giá vốn hàng bán FIFO (COGS). */
    public static final String INVENTORY_COGS          = "inventory:cogs";

    // ======================== HR ========================

    /** Chấm công tháng. */
    public static final String HR_ATTENDANCE           = "hr:attendance";

    /** Vi phạm chấm công. */
    public static final String HR_VIOLATIONS           = "hr:violations";

    /** Chi phí nhân sự aggregate. */
    public static final String HR_COST                 = "hr:cost";

    /** Lịch sử check-in chi tiết. */
    public static final String HR_CHECKIN_HISTORY      = "hr:checkin-history";

    // ================== HR SENSITIVE (sensitiveCacheManager) ==================

    /** Bảng lương (privacy-sensitive — 30 min TTL, sensitiveCacheManager). */
    public static final String HR_PAYROLL              = "hr:payroll";
}
