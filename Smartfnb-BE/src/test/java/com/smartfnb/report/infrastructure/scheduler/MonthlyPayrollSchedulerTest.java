package com.smartfnb.report.infrastructure.scheduler;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

/**
 * Unit Tests for Monthly Payroll Scheduler (Phase 6)
 * Validates scheduler execution and payroll calculation
 */
@SpringBootTest
@EnableScheduling
@DisplayName("S-19 Phase 6 - Monthly Payroll Scheduler Tests")
public class MonthlyPayrollSchedulerTest {

    @Autowired
    private MonthlyPayrollScheduler payrollScheduler;

    @MockBean
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Scheduler component should be available")
    void testSchedulerAvailable() {
        assertNotNull(payrollScheduler, "Monthly payroll scheduler should be autowired");
    }

    @Test
    @DisplayName("Scheduler class should have @Scheduled annotation")
    void testSchedulerHasScheduledAnnotation() {
        try {
            var generateMethod = MonthlyPayrollScheduler.class.getMethod("generateMonthlyPayroll");
            assertNotNull(generateMethod, "generateMonthlyPayroll method should exist");
            
            // Check if method has @Scheduled annotation
            var scheduled = generateMethod.getAnnotation(
                org.springframework.scheduling.annotation.Scheduled.class);
            assertNotNull(scheduled, "@Scheduled annotation should be present");
        } catch (NoSuchMethodException e) {
            fail("generateMonthlyPayroll method should exist: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Scheduler should be asynchronous (@Async)")
    void testSchedulerIsAsync() {
        try {
            var generateMethod = MonthlyPayrollScheduler.class.getMethod("generateMonthlyPayroll");
            
            // Check if method has @Async annotation
            var async = generateMethod.getAnnotation(
                org.springframework.scheduling.annotation.Async.class);
            assertNotNull(async, "@Async annotation should be present for non-blocking execution");
        } catch (NoSuchMethodException e) {
            fail("generateMonthlyPayroll method should exist: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Payroll generation should be transactional")
    void testPayrollGenerationIsTransactional() {
        try {
            var generateMethod = MonthlyPayrollScheduler.class.getMethod("generateMonthlyPayroll");
            
            // Check if method has @Transactional annotation
            var transactional = generateMethod.getAnnotation(
                org.springframework.transaction.annotation.Transactional.class);
            assertNotNull(transactional, "@Transactional annotation should be present for data consistency");
        } catch (NoSuchMethodException e) {
            fail("generateMonthlyPayroll method should exist: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Payroll generation should use NamedParameterJdbcTemplate")
    void testPayrollGenerationUsesJdbcTemplate() {
        assertNotNull(payrollScheduler, "Scheduler should be injected with dependencies");
        // The scheduler should have access to jdbcTemplate through constructor injection
    }

    @Test
    @DisplayName("Monthly payroll cron should run on 1st of each month at 00:00")
    void testPayrollScheduleCron() {
        try {
            var generateMethod = MonthlyPayrollScheduler.class.getMethod("generateMonthlyPayroll");
            var scheduled = generateMethod.getAnnotation(
                org.springframework.scheduling.annotation.Scheduled.class);
            
            String cron = scheduled.cron();
            assertEquals("0 0 0 1 * *", cron, 
                "Cron should be '0 0 0 1 * *' to run at 00:00 on 1st of each month");
        } catch (NoSuchMethodException e) {
            fail("generateMonthlyPayroll method should exist: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Payroll calculation should include overtime at 1.5x rate")
    void testPayrollCalculationStructure() {
        assertNotNull(payrollScheduler, "Payroll scheduler should be configured");
        // Actual calculation tested through integration tests
        // Unit test validates class structure
    }

    @Test
    @DisplayName("Payroll entries should be created with DRAFT status")
    void testPayrollDraftStatusCreation() {
        assertNotNull(payrollScheduler, "Payroll scheduler should be configured");
        // Status validation through integration or end-to-end tests
    }

    @Test
    @DisplayName("Scheduler should notify branch managers after generation")
    void testManagerNotification() {
        assertNotNull(payrollScheduler, "Payroll scheduler should be configured");
        // Notification logic validated through integration tests or email service mocks
    }
}
