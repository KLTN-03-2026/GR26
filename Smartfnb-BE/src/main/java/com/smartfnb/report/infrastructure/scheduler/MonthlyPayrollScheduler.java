package com.smartfnb.report.infrastructure.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * FIXED: Monthly Payroll Scheduler with Multi-Tenant Support
 * 
 * Root causes fixed:
 * 1. No multi-tenant context - Added getAllActiveTenants() + per-tenant processing
 * 2. Wrong month calculation - Changed from current month to previous month
 * 3. Low precision - Increased BigDecimal scale from 2 to 10 for hourly rates
 * 4. No validation - Added negative value checks
 * 5. Logging - Replaced System.err with SLF4J Logger (Rule 7 compliance)
 */
@Slf4j
@Component
public class MonthlyPayrollScheduler {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    
    // Configuration constants - parameterized from application.yml
    @Value("${payroll.monthly-hours-threshold:160}")
    private int monthlyHoursThreshold;
    
    @Value("${payroll.overtime-multiplier:1.5}")
    private double overtimeMultiplier;

    public MonthlyPayrollScheduler(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Run at 00:00 on the 1st of every month
     * Now processes all active tenants with proper isolation
     */
    @Scheduled(cron = "0 0 0 1 * *")
    @Async
    @Transactional
    public void generateMonthlyPayroll() {
        YearMonth previousMonth = YearMonth.now().minusMonths(1);

        // Get all active tenants and process each separately
        List<Map<String, Object>> tenants = getAllActiveTenants();

        for (Map<String, Object> tenant : tenants) {
            UUID tenantId = (UUID) tenant.get("id");
            String tenantName = (String) tenant.get("name");

            try {
                generatePayrollForTenant(tenantId, tenantName, previousMonth);
            } catch (Exception e) {
                log.error("Failed to generate payroll for tenant {}: {}", tenantName, e.getMessage(), e);
            }
        }
    }

    /**
     * Generate payroll for a specific tenant
     * Ensures multi-tenant isolation - data for one tenant doesn't affect others
     */
    private void generatePayrollForTenant(UUID tenantId, String tenantName, YearMonth month) {
        List<Map<String, Object>> branches = getAllBranchesForTenant(tenantId);

        for (Map<String, Object> branch : branches) {
            UUID branchId = (UUID) branch.get("id");

            try {
                generatePayrollForBranch(tenantId, branchId, month);
            } catch (Exception e) {
                log.error("Failed to generate payroll for branch {}: {}", branchId, e.getMessage(), e);
            }
        }
    }

    /**
     * Generate payroll for a specific branch
     */
    private void generatePayrollForBranch(UUID tenantId, UUID branchId, YearMonth month) {
        List<Map<String, Object>> staffList = getStaffForBranch(tenantId, branchId);

        for (Map<String, Object> staff : staffList) {
            UUID staffId = (UUID) staff.get("id");

            try {
                BigDecimal netSalary = calculatePayroll(tenantId, staffId, month);
                if (netSalary != null && netSalary.compareTo(BigDecimal.ZERO) >= 0) {
                    savePayroll(tenantId, staffId, month, netSalary);
                }
            } catch (Exception e) {
                log.error("Failed to calculate payroll for staff {}: {}", staffId, e.getMessage(), e);
            }
        }
    }

    /**
     * Calculate payroll for a staff member
     * FIX: Use 10 decimal places for hourly rate to prevent precision loss
     */
    private BigDecimal calculatePayroll(UUID tenantId, UUID staffId, YearMonth month) {
        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("staffId", staffId);

        String sql = "SELECT salary FROM staff WHERE id = :staffId AND tenant_id = :tenantId";
        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, params);

        if (result.isEmpty()) {
            return null;
        }

        BigDecimal baseSalary = (BigDecimal) result.get(0).get("salary");

        if (baseSalary == null || baseSalary.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Invalid base salary: " + baseSalary);
        }

        // FIX: Use 10 decimal places for hourly rate calculation
        // WRONG: scale(2) causes precision loss for large Vietnamese salaries (50M+)
        // CORRECT: scale(10) maintains precision through calculation
        BigDecimal hourlyRate = baseSalary.divide(BigDecimal.valueOf(monthlyHoursThreshold), 10, RoundingMode.HALF_UP);

        BigDecimal overtimePay = calculateOvertimePay(tenantId, staffId, hourlyRate, month);
        BigDecimal bonuses = calculateBonuses(tenantId, staffId, month);
        BigDecimal deductions = getTotalDeductions(tenantId, staffId, month);

        BigDecimal grossSalary = baseSalary.add(overtimePay).add(bonuses);
        BigDecimal netSalary = grossSalary.subtract(deductions);

        // Validate all calculations
        if (grossSalary.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Gross salary is negative: " + grossSalary);
        }

        if (netSalary.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Net salary is negative: " + netSalary);
        }

        return netSalary.setScale(0, RoundingMode.HALF_UP);
    }

    /**
     * Get all active tenants for multi-tenant processing
     */
    private List<Map<String, Object>> getAllActiveTenants() {
        String sql = "SELECT id, name FROM tenants WHERE status = 'ACTIVE' AND deleted_at IS NULL";
        return jdbcTemplate.queryForList(sql, new HashMap<>());
    }

    /**
     * Get all branches for a specific tenant
     * Includes tenant_id filter for isolation
     */
    private List<Map<String, Object>> getAllBranchesForTenant(UUID tenantId) {
        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);

        String sql = "SELECT id FROM branches WHERE tenant_id = :tenantId AND status = 'ACTIVE' AND deleted_at IS NULL";
        return jdbcTemplate.queryForList(sql, params);
    }

    /**
     * Get all staff for a branch
     * Includes tenant_id filter for isolation
     */
    private List<Map<String, Object>> getStaffForBranch(UUID tenantId, UUID branchId) {
        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("branchId", branchId);

        String sql = "SELECT s.id FROM staff s "
                + "JOIN users u ON s.user_id = u.id "
                + "WHERE s.branch_id = :branchId "
                + "  AND u.tenant_id = :tenantId "
                + "  AND s.status = 'ACTIVE' "
                + "  AND s.deleted_at IS NULL";
        return jdbcTemplate.queryForList(sql, params);
    }

    /**
     * Calculate overtime pay
     * Uses high-precision hourly rate
     */
    private BigDecimal calculateOvertimePay(UUID tenantId, UUID staffId, BigDecimal hourlyRate, YearMonth month) {
        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("staffId", staffId);
        params.put("year", month.getYear());
        params.put("month", month.getMonthValue());

        String sql = "SELECT COALESCE(SUM(overtime_minutes), 0) as totalOvertimeMinutes "
                + "FROM checkin_history ch "
                + "JOIN shift_schedules ss ON ch.shift_schedule_id = ss.id "
                + "JOIN staff s ON ss.staff_id = s.id "
                + "JOIN users u ON s.user_id = u.id "
                + "WHERE s.id = :staffId "
                + "  AND u.tenant_id = :tenantId "
                + "  AND ch.shift_status = 'COMPLETED' "
                + "  AND EXTRACT(YEAR FROM ch.created_at) = :year "
                + "  AND EXTRACT(MONTH FROM ch.created_at) = :month";

        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, params);
        if (result.isEmpty() || result.get(0).get("totalOvertimeMinutes") == null) {
            return BigDecimal.ZERO;
        }

        long overtimeMinutes = ((Number) result.get(0).get("totalOvertimeMinutes")).longValue();
        BigDecimal overtimeHours = BigDecimal.valueOf(overtimeMinutes).divide(BigDecimal.valueOf(60), 10, RoundingMode.HALF_UP);

        // ✅ PARAMETERIZED: Overtime multiplier from application.yml (default 1.5x)
        return hourlyRate.multiply(BigDecimal.valueOf(overtimeMultiplier)).multiply(overtimeHours);
    }

    /**
     * Calculate bonuses for staff
     */
    private BigDecimal calculateBonuses(UUID tenantId, UUID staffId, YearMonth month) {
        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("staffId", staffId);
        params.put("year", month.getYear());
        params.put("month", month.getMonthValue());

        String sql = "SELECT COALESCE(SUM(amount), 0) as totalBonus "
                + "FROM bonuses "
                + "WHERE staff_id = :staffId "
                + "  AND tenant_id = :tenantId "
                + "  AND EXTRACT(YEAR FROM month) = :year "
                + "  AND EXTRACT(MONTH FROM month) = :month "
                + "  AND deleted_at IS NULL";

        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, params);
        if (result.isEmpty() || result.get(0).get("totalBonus") == null) {
            return BigDecimal.ZERO;
        }

        return (BigDecimal) result.get(0).get("totalBonus");
    }

    /**
     * Get total deductions for staff
     * Includes tenant_id filter
     */
    private BigDecimal getTotalDeductions(UUID tenantId, UUID staffId, YearMonth month) {
        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("staffId", staffId);
        params.put("year", month.getYear());
        params.put("month", month.getMonthValue());

        String sql = "SELECT COALESCE(SUM(amount), 0) as totalDeduction "
                + "FROM deductions "
                + "WHERE staff_id = :staffId "
                + "  AND tenant_id = :tenantId "
                + "  AND EXTRACT(YEAR FROM month) = :year "
                + "  AND EXTRACT(MONTH FROM month) = :month "
                + "  AND deleted_at IS NULL";

        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, params);
        if (result.isEmpty() || result.get(0).get("totalDeduction") == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal deductions = (BigDecimal) result.get(0).get("totalDeduction");

        if (deductions.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Deductions are negative: " + deductions);
        }

        return deductions;
    }

    /**
     * Save payroll entry to database
     * ✅ IDEMPOTENT: ON CONFLICT ensures duplicate payroll entries are updated, not created
     * ✅ CHECK: Verify payroll doesn't already exist to avoid double-processing
     */
    private void savePayroll(UUID tenantId, UUID staffId, YearMonth month, BigDecimal netSalary) {
        // Check if payroll already exists for this month
        String checkSql = "SELECT COUNT(*) as cnt FROM payroll_entries "
                + "WHERE tenant_id = :tenantId AND staff_id = :staffId AND month = :month AND deleted_at IS NULL";
        Map<String, Object> checkParams = new HashMap<>();
        checkParams.put("tenantId", tenantId);
        checkParams.put("staffId", staffId);
        checkParams.put("month", month);
        
        List<Map<String, Object>> checkResult = jdbcTemplate.queryForList(checkSql, checkParams);
        long existingCount = ((Number) checkResult.get(0).get("cnt")).longValue();
        
        if (existingCount > 0) {
            log.warn("Payroll already exists for staff {} in month {}. Skipping to prevent duplicate processing.", staffId, month);
            return;
        }

        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("staffId", staffId);
        params.put("month", month);
        params.put("netSalary", netSalary);

        String sql = "INSERT INTO payroll_entries (id, tenant_id, staff_id, month, net_salary, status, created_at) "
                + "VALUES (UUID_GENERATE_V4(), :tenantId, :staffId, :month, :netSalary, 'DRAFT', NOW()) "
                + "ON CONFLICT (tenant_id, staff_id, month) DO UPDATE SET net_salary = :netSalary, updated_at = NOW() "
                + "WHERE excluded.deleted_at IS NULL";

        jdbcTemplate.update(sql, params);
        log.info("Payroll saved successfully for staff {} in month {}", staffId, month);
    }
}
