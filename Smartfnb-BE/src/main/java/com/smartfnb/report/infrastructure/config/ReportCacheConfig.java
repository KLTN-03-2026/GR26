package com.smartfnb.report.infrastructure.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

/**
 * Cache Configuration cho S-19 Reports
 * 
 * 🚀 UPGRADED: Now using Caffeine with TTL support
 * Previous issue: ConcurrentMapCacheManager had no TTL - caches never expired!
 * 
 * 2 Cache Managers:
 * 1. reportCacheManager (2 hour TTL)
 *    - inventory:stock, inventory:expiring, inventory:waste, inventory:cogs
 *    - hr:attendance, hr:violations, hr:cost, hr:checkin-history
 * 
 * 2. sensitiveCacheManager (30 minute TTL - shorter for privacy)
 *    - hr:payroll (privacy-sensitive salary data)
 * 
 * Invalidation triggers:
 * - OrderCompleted → inventory caches
 * - ShiftCompleted → HR caches
 * - InventoryUpdated → inventory caches
 * - PayrollGenerated → payroll cache
 */
@Configuration
@EnableCaching
public class ReportCacheConfig {
    
    /**
     * ✅ Report Cache Manager with 2-hour TTL
     * 
     * Caches business data that changes occasionally:
     * - inventory:stock         (non-sensitive)
     * - inventory:expiring-items (non-sensitive)
     * - inventory:movement       (non-sensitive)
     * - inventory:waste          (non-sensitive)
     * - inventory:cogs           (non-sensitive)
     * - hr:attendance            (non-sensitive aggregate)
     * - hr:violations            (non-sensitive aggregate)
     * - hr:cost                  (non-sensitive aggregate)
     * - hr:checkin-history       (non-sensitive data)
     */
    @Bean(name = "reportCacheManager")
    @Primary
    public CacheManager reportCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        
        // Build cache with 2 hour expiration
        // ⚠️ IMPORTANT: Pass Caffeine builder WITHOUT calling .build()
        cacheManager.setCaffeine(
            Caffeine.newBuilder()
                .expireAfterWrite(2, TimeUnit.HOURS)   // Expire after 2 hours
                .maximumSize(10000)                     // Max 10k entries to prevent memory leaks
                .recordStats()                          // Enable cache statistics for monitoring
        );
        
        cacheManager.setCacheNames(Arrays.asList(
                // Inventory caches (non-sensitive)
                "inventory:stock",
                "inventory:expiring-items",
                "inventory:movement",
                "inventory:waste",
                "inventory:cogs",
                
                // HR caches (non-sensitive aggregate data)
                "hr:attendance",
                "hr:violations",
                "hr:cost",
                "hr:checkin-history"
        ));
        
        return cacheManager;
    }
    
    /**
     * 🔒 Sensitive Cache Manager with 30-minute TTL
     * 
     * Privacy-enforced cache for highly sensitive data (salaries, personal details).
     * Shorter TTL (30 minutes) than general caches to minimize exposure risk.
     * 
     * Caches:
     * - hr:payroll (sensitive salary data - 30min TTL only)
     */
    @Bean(name = "sensitiveCacheManager")
    public CacheManager sensitiveCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        
        // Build cache with shorter 30 minute expiration for privacy
        cacheManager.setCaffeine(
            Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.MINUTES)  // Shorter TTL for sensitive data
                .maximumSize(1000)                        // Smaller max size for sensitive data
                .recordStats()
        );
        
        cacheManager.setCacheNames(Arrays.asList(
                "hr:payroll"  // Sensitive salary data only
        ));
        
        return cacheManager;
    }
}
