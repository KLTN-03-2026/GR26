package com.smartfnb.report.presentation.controller;

import com.smartfnb.report.infrastructure.config.ReportCacheConfig;
import com.smartfnb.report.infrastructure.scheduler.MonthlyPayrollScheduler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Configuration and Component Tests for Phase 7
 * Validates cache configuration and scheduler setup
 */
@SpringBootTest
@DisplayName("S-19 Phase 7 - Configuration & Component Tests")
public class ReportConfigurationTest {

    @Autowired(required = false)
    private CacheManager reportCacheManager;

    @Autowired(required = false)
    @Qualifier("sensitiveCacheManager")
    private CacheManager sensitiveCacheManager;

    @Autowired(required = false)
    private MonthlyPayrollScheduler payrollScheduler;

    @Test
    @DisplayName("Report cache manager should be configured")
    void testReportCacheManagerConfiguration() {
        assertNotNull(reportCacheManager, "Report cache manager should be created");
        assertNotNull(reportCacheManager.getCache("inventory:stock"), 
            "inventory:stock cache should exist");
        assertNotNull(reportCacheManager.getCache("hr:attendance"), 
            "hr:attendance cache should exist");
    }

    @Test
    @DisplayName("Sensitive cache manager should be configured for payroll")
    void testSensitiveCacheManagerConfiguration() {
        assertNotNull(sensitiveCacheManager, "Sensitive cache manager should be created");
        assertNotNull(sensitiveCacheManager.getCache("hr:payroll"), 
            "hr:payroll cache should exist for privacy-sensitive data");
    }

    @Test
    @DisplayName("Monthly payroll scheduler should be available")
    void testPayrollSchedulerConfiguration() {
        assertNotNull(payrollScheduler, "Monthly payroll scheduler should be configured");
    }

    @Test
    @DisplayName("Cache names should include all required report types")
    void testAllRequiredCachesExist() {
        String[] requiredCaches = {
            "inventory:stock",
            "inventory:expiring-items",
            "inventory:movement",
            "inventory:waste",
            "inventory:cogs",
            "hr:attendance",
            "hr:violations",
            "hr:cost",
            "hr:checkin-history"
        };

        for (String cacheName : requiredCaches) {
            assertNotNull(reportCacheManager.getCache(cacheName),
                "Cache '" + cacheName + "' should be configured");
        }
    }

    @Test
    @DisplayName("Payroll cache should be in sensitive cache manager")
    void testPayrollCachePrivacy() {
        assertNotNull(sensitiveCacheManager.getCache("hr:payroll"),
            "Payroll cache should be in sensitive cache manager for privacy");
    }
}
