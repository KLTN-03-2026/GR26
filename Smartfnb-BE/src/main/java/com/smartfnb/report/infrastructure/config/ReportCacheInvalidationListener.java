package com.smartfnb.report.infrastructure.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Cache Invalidation Event Listener cho S-19 Reports
 * 
 * Listens to domain events và invalidate relevant caches:
 * - OrderCompleted → Invalidate inventory & revenue caches
 * - ShiftCompleted → Invalidate HR caches (attendance, violations)
 * - InventoryUpdated → Invalidate inventory caches
 * - PayrollGenerated → Invalidate payroll cache (sensitive)
 * 
 * Pattern: Event-driven cache invalidation để đảm bảo dữ liệu luôn fresh
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReportCacheInvalidationListener {
    
    private final CacheManager reportCacheManager;
    private final CacheManager sensitiveCacheManager;
    
    /**
     * Xử lý OrderCompleted event
     * 
     * Invalidate caches:
     * - inventory:stock (vì stock thay đổi khi order xuất)
     * - inventory:cogs (vì COGS depends on exports)
     * - inventory:waste (vì có thể có waste adjustment)
     */
    @EventListener
    @Async
    public void onOrderCompleted(String eventName) {
        if ("OrderCompleted".equals(eventName) || eventName.contains("OrderCompleted")) {
            log.info("🔄 Cache invalidation triggered: OrderCompleted event received");
            
            // Invalidate inventory caches
            clearCache("inventory:stock");
            clearCache("inventory:cogs");
            clearCache("inventory:waste");
            clearCache("inventory:movement");
            
            log.info("✅ Inventory caches invalidated");
        }
    }
    
    /**
     * Xử lý ShiftCompleted event
     * 
     * Invalidate caches:
     * - hr:attendance (vì attendance count changes)
     * - hr:violations (vì violations may be resolved)
     * - hr:checkin-history (vì shift data updated)
     */
    @EventListener
    @Async
    public void onShiftCompleted(String eventName) {
        if ("ShiftCompleted".equals(eventName) || eventName.contains("ShiftCompleted")) {
            log.info("🔄 Cache invalidation triggered: ShiftCompleted event received");
            
            // Invalidate HR caches
            clearCache("hr:attendance");
            clearCache("hr:violations");
            clearCache("hr:checkin-history");
            
            log.info("✅ HR caches invalidated");
        }
    }
    
    /**
     * Xử lý InventoryUpdated event
     * 
     * Invalidate caches:
     * - inventory:stock (main cache)
     * - inventory:expiring-items (expiry data may change)
     * - inventory:movement (tùy loại update)
     */
    @EventListener
    @Async
    public void onInventoryUpdated(String eventName) {
        if ("InventoryUpdated".equals(eventName) || eventName.contains("InventoryUpdated")) {
            log.info("🔄 Cache invalidation triggered: InventoryUpdated event received");
            
            // Invalidate all inventory caches
            clearCache("inventory:stock");
            clearCache("inventory:expiring-items");
            clearCache("inventory:movement");
            clearCache("inventory:waste");
            clearCache("inventory:cogs");
            
            log.info("✅ All inventory caches invalidated");
        }
    }
    
    /**
     * Xử lý PayrollGenerated event (🔒 Sensitive)
     * 
     * Invalidate caches:
     * - hr:payroll (sensitive cache manager)
     * - hr:cost (related to payroll)
     */
    @EventListener
    @Async
    public void onPayrollGenerated(String eventName) {
        if ("PayrollGenerated".equals(eventName) || eventName.contains("PayrollGenerated")) {
            log.info("🔒🔄 Cache invalidation triggered: PayrollGenerated event received");
            
            // Invalidate sensitive payroll cache
            clearCache(sensitiveCacheManager, "hr:payroll");
            
            // Also invalidate related cost cache
            clearCache(reportCacheManager, "hr:cost");
            
            log.info("✅ Payroll and HR cost caches invalidated (🔒 sensitive)");
        }
    }
    
    /**
     * Xử lý ShiftScheduleCreated event
     * 
     * Invalidate caches:
     * - hr:attendance (schedule affects attendance projections)
     * - hr:checkin-history (new schedule added)
     */
    @EventListener
    @Async
    public void onShiftScheduleCreated(String eventName) {
        if ("ShiftScheduleCreated".equals(eventName) || eventName.contains("ShiftScheduleCreated")) {
            log.info("🔄 Cache invalidation triggered: ShiftScheduleCreated event received");
            
            clearCache("hr:attendance");
            clearCache("hr:checkin-history");
            
            log.info("✅ HR schedule-related caches invalidated");
        }
    }
    
    /**
     * Helper: Clear cache by name from report cache manager
     */
    private void clearCache(String cacheName) {
        clearCache(reportCacheManager, cacheName);
    }
    
    /**
     * Helper: Clear cache by name from specific cache manager
     */
    private void clearCache(CacheManager cacheManager, String cacheName) {
        try {
            if (cacheManager != null && cacheManager.getCache(cacheName) != null) {
                cacheManager.getCache(cacheName).clear();
                log.debug("✓ Cleared cache: {}", cacheName);
            }
        } catch (Exception e) {
            log.warn("Failed to clear cache: {}", cacheName, e);
        }
    }
    
    /**
     * Batch invalidation: Clear all report caches
     * 用于手动强制刷新（例如：管理员操作）
     */
    public void invalidateAllReportCaches() {
        log.warn("🔄 Invalidating ALL report caches (manual trigger)");
        
        clearCache("inventory:stock");
        clearCache("inventory:expiring-items");
        clearCache("inventory:movement");
        clearCache("inventory:waste");
        clearCache("inventory:cogs");
        clearCache("hr:attendance");
        clearCache("hr:violations");
        clearCache("hr:cost");
        clearCache("hr:checkin-history");
        
        log.info("✅ All report caches invalidated");
    }
    
    /**
     * Batch invalidation: Clear all sensitive caches
     */
    public void invalidateSensitiveCaches() {
        log.warn("🔒 Invalidating ALL sensitive caches (manual trigger)");
        clearCache(sensitiveCacheManager, "hr:payroll");
        log.info("✅ All sensitive caches invalidated");
    }
}
