package com.smartfnb.report.infrastructure.repository;

import com.smartfnb.report.application.dto.hr.*;
import com.smartfnb.report.domain.repository.HrReportRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * ✅ FIXED: HR Report Repository Implementation
 * Adjusted to match the actual database schema and DTO fields.
 */
@Repository
public class HrReportRepositoryImpl implements HrReportRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public HrReportRepositoryImpl(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof BigDecimal bd) return bd;
        if (val instanceof Number n) return new BigDecimal(n.toString());
        return BigDecimal.ZERO;
    }

    private UUID toUUID(Object val) {
        if (val == null) return null;
        if (val instanceof UUID u) return u;
        try {
            return UUID.fromString(val.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDate toLocalDate(Object val) {
        if (val == null) return null;
        if (val instanceof LocalDate ld) return ld;
        if (val instanceof java.sql.Date d) return d.toLocalDate();
        if (val instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toLocalDate();
        return null;
    }

    private LocalTime toLocalTime(Object val) {
        if (val == null) return null;
        if (val instanceof LocalTime lt) return lt;
        if (val instanceof java.sql.Time t) return t.toLocalTime();
        if (val instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toLocalTime();
        return null;
    }

    @Override
    public List<AttendanceReportDto> findAttendanceReport(UUID branchId, UUID tenantId, YearMonth month) {
        String sql = """
                SELECT
                    u.id as staffId,
                    u.full_name as staffName,
                    pos.name as position,
                    pos.id as positionId,
                    COUNT(CASE WHEN ss.status = 'COMPLETED' THEN 1 END) as workingDays,
                    COALESCE(SUM(ss.overtime_minutes / 60.0), 0) as overtimeHours,
                    COUNT(CASE WHEN ss.status = 'ABSENT' THEN 1 END) as absentDays,
                    0 as leaveDays,
                    b.id as branchId,
                    b.name as branchName
                FROM users u
                JOIN branch_users bu ON u.id = bu.user_id
                JOIN branches b ON bu.branch_id = b.id
                LEFT JOIN positions pos ON u.position_id = pos.id
                LEFT JOIN shift_schedules ss ON u.id = ss.user_id
                    AND EXTRACT(YEAR FROM ss.date) = :year
                    AND EXTRACT(MONTH FROM ss.date) = :month
                WHERE bu.branch_id = :branchId
                  AND u.tenant_id = :tenantId
                  AND u.deleted_at IS NULL
                GROUP BY u.id, u.full_name, pos.name, pos.id, b.id, b.name
                ORDER BY u.full_name
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("branchId", branchId);
        params.put("tenantId", tenantId);
        params.put("year", month.getYear());
        params.put("month", month.getMonthValue());
        params.put("monthStart", LocalDate.of(month.getYear(), month.getMonthValue(), 1));

        int daysInMonth = month.lengthOfMonth();
        String monthStr = month.toString();

        return jdbcTemplate.query(sql, params, (rs, rowNum) -> {
            int workingDays = rs.getInt("workingDays");
            int percentage = (daysInMonth > 0) ? (int) Math.round((workingDays * 100.0) / daysInMonth) : 0;
            
            return AttendanceReportDto.builder()
                .staffId(toUUID(rs.getObject("staffId")))
                .staffName(rs.getString("staffName"))
                .position(rs.getString("position"))
                .positionId(rs.getString("positionId") != null ? rs.getString("positionId") : null)
                .workingDays(workingDays)
                .overtimeHours(toBigDecimal(rs.getObject("overtimeHours")))
                .absentDays(rs.getInt("absentDays"))
                .leaveDays(rs.getInt("leaveDays"))
                .month(monthStr)
                .daysInMonth(daysInMonth)
                .attendancePercentage(percentage)
                .branchId(rs.getString("branchId") != null ? UUID.fromString(rs.getString("branchId")) : branchId)
                .branchName(rs.getString("branchName"))
                .build();
        });
    }

    @Override
    public Page<ViolationReportDto> findViolations(UUID branchId, UUID tenantId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        String countSql = """
                SELECT COUNT(*)
                FROM shift_schedules ss
                JOIN users u ON ss.user_id = u.id
                JOIN shift_templates st ON ss.shift_template_id = st.id
                WHERE ss.branch_id = :branchId
                  AND ss.tenant_id = :tenantId
                  AND ss.date >= :startDate
                  AND ss.date <= :endDate
                  AND (ss.status = 'ABSENT' OR ss.actual_start_time > st.start_time)
                """;

        String sql = """
                SELECT
                    u.id as staffId,
                    u.full_name as staffName,
                    pos.name as position,
                    ss.date as date,
                    st.name as shiftName,
                    st.start_time as scheduledStartTime,
                    st.end_time as scheduledEndTime,
                    ss.actual_start_time as actualCheckinTime,
                    ss.actual_end_time as actualCheckoutTime,
                    ss.overtime_minutes as minutesViolation,
                    CASE
                        WHEN ss.status = 'ABSENT' THEN 'ABSENT'
                        WHEN ss.actual_start_time IS NULL THEN 'NO_CHECKIN'
                        WHEN ss.actual_start_time > st.start_time THEN 'LATE'
                        ELSE 'ON_TIME'
                    END as violationType
                FROM shift_schedules ss
                JOIN users u ON ss.user_id = u.id
                JOIN shift_templates st ON ss.shift_template_id = st.id
                LEFT JOIN positions pos ON u.position_id = pos.id
                WHERE ss.branch_id = :branchId
                  AND ss.tenant_id = :tenantId
                  AND ss.date >= :startDate
                  AND ss.date <= :endDate
                  AND (ss.status = 'ABSENT' OR ss.actual_start_time > st.start_time)
                ORDER BY ss.date DESC, u.full_name
                LIMIT :limit OFFSET :offset
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("branchId", branchId);
        params.put("tenantId", tenantId);
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        params.put("limit", pageable.getPageSize());
        params.put("offset", pageable.getOffset());

        long total = jdbcTemplate.queryForObject(countSql, params, Long.class);

        List<ViolationReportDto> content = jdbcTemplate.query(sql, params, (rs, rowNum) -> ViolationReportDto.builder()
                .staffId(toUUID(rs.getObject("staffId")))
                .staffName(rs.getString("staffName"))
                .position(rs.getString("position"))
                .date(toLocalDate(rs.getObject("date")))
                .shiftName(rs.getString("shiftName"))
                .shiftStartTime(toLocalTime(rs.getObject("scheduledStartTime")))
                .shiftEndTime(toLocalTime(rs.getObject("scheduledEndTime")))
                .actualCheckinTime(toLocalTime(rs.getObject("actualCheckinTime")))
                .actualCheckoutTime(toLocalTime(rs.getObject("actualCheckoutTime")))
                .minutesViolation(rs.getInt("minutesViolation"))
                .violationType(rs.getString("violationType"))
                .build());

        return new PageImpl<>(content, pageable, total);
    }

    @Override
    public List<PayrollReportDto> findPayroll(UUID branchId, UUID tenantId, YearMonth month, UUID staffId) {
        String sql = """
                SELECT
                    u.id as staffId,
                    u.full_name as staffName,
                    pos.name as position,
                    p.branch_id as branchId,
                    b.name as branchName,
                    TO_CHAR(p.year_month, 'YYYY-MM') as month,
                    p.base_salary as baseSalary,
                    p.working_days as workingDays,
                    p.overtime_hours as overtimeHours,
                    p.overtime_pay as overtimePay,
                    p.total_bonuses as totalBonuses,
                    p.total_deductions as totalDeductions,
                    p.gross_salary as grossSalary,
                    p.status as status,
                    p.submitted_by::text as approvedBy,
                    TO_CHAR(p.paid_at, 'YYYY-MM-DD HH24:MI:SS') as paidAt,
                    p.payment_method as paymentMethod,
                    TO_CHAR(p.created_at, 'YYYY-MM-DD HH24:MI:SS') as createdAt,
                    TO_CHAR(p.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updatedAt
                FROM payroll_entries p
                JOIN users u ON p.staff_id = u.id
                JOIN branches b ON p.branch_id = b.id
                LEFT JOIN positions pos ON u.position_id = pos.id
                WHERE p.branch_id = :branchId
                  AND p.tenant_id = :tenantId
                  AND p.year_month = :monthStart
                """ + (staffId != null ? " AND p.staff_id = :staffId" : "");

        Map<String, Object> params = new HashMap<>();
        params.put("branchId", branchId);
        params.put("tenantId", tenantId);
        params.put("monthStart", LocalDate.of(month.getYear(), month.getMonthValue(), 1));
        if (staffId != null) {
            params.put("staffId", staffId);
        }

        return jdbcTemplate.query(sql, params, (rs, rowNum) -> PayrollReportDto.builder()
                .staffId(toUUID(rs.getObject("staffId")))
                .staffName(rs.getString("staffName"))
                .position(rs.getString("position"))
                .branchId(toUUID(rs.getObject("branchId")))
                .branchName(rs.getString("branchName"))
                .month(rs.getString("month"))
                .baseSalary(toBigDecimal(rs.getObject("baseSalary")))
                .workingDays(rs.getInt("workingDays"))
                .overtimeHours(toBigDecimal(rs.getObject("overtimeHours")))
                .overtimePay(toBigDecimal(rs.getObject("overtimePay")))
                .totalBonuses(toBigDecimal(rs.getObject("totalBonuses")))
                .totalDeductions(toBigDecimal(rs.getObject("totalDeductions")))
                .grossSalary(toBigDecimal(rs.getObject("grossSalary")))
                .status(rs.getString("status"))
                .approvedBy(rs.getString("approvedBy"))
                .paidAt(rs.getString("paidAt"))
                .paymentMethod(rs.getString("paymentMethod"))
                .createdAt(rs.getString("createdAt"))
                .updatedAt(rs.getString("updatedAt"))
                .build());
    }

    @Override
    public HrCostReportDto findHrCost(UUID branchId, UUID tenantId, YearMonth month) {
        String sql = """
                SELECT
                    b.name as branchName,
                    COUNT(DISTINCT p.staff_id) as totalStaff,
                    COALESCE(SUM(p.base_salary), 0) as baseSalaryCost,
                    COALESCE(SUM(p.overtime_pay), 0) as overtimeCost,
                    COALESCE(SUM(p.total_bonuses), 0) as bonusCost,
                    COALESCE(SUM(p.total_deductions), 0) as deductionsCost,
                    COALESCE(SUM(p.gross_salary), 0) as totalHrCost
                FROM branches b
                LEFT JOIN payroll_entries p ON b.id = p.branch_id
                    AND p.year_month = :monthStart
                WHERE b.id = :branchId
                  AND b.tenant_id = :tenantId
                GROUP BY b.id, b.name
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("branchId", branchId);
        params.put("tenantId", tenantId);
        params.put("monthStart", LocalDate.of(month.getYear(), month.getMonthValue(), 1));

        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, params);

        if (result.isEmpty()) {
            return HrCostReportDto.builder()
                    .branchId(branchId)
                    .branchName("Unknown")
                    .month(month.toString())
                    .totalStaff(0)
                    .totalHrCost(BigDecimal.ZERO)
                    .build();
        }

        Map<String, Object> row = result.get(0);
        BigDecimal totalHrCost = toBigDecimal(row.get("totalHrCost"));
        Integer totalStaff = ((Number) row.get("totalStaff")).intValue();

        return HrCostReportDto.builder()
                .branchId(branchId)
                .branchName((String) row.get("branchName"))
                .month(month.toString())
                .totalStaff(totalStaff)
                .baseSalaryCost(toBigDecimal(row.get("baseSalaryCost")))
                .overtimeCost(toBigDecimal(row.get("overtimeCost")))
                .bonusCost(toBigDecimal(row.get("bonusCost")))
                .deductionsCost(toBigDecimal(row.get("deductionsCost")))
                .totalHrCost(totalHrCost)
                .build();
    }

    @Override
    public Page<CheckinHistoryDto> findCheckinHistory(UUID branchId, UUID staffId, UUID tenantId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        String countSql = """
                SELECT COUNT(*)
                FROM shift_schedules ss
                JOIN users u ON ss.user_id = u.id
                WHERE ss.user_id = :staffId
                  AND ss.tenant_id = :tenantId
                  AND ss.branch_id = :branchId
                  AND ss.date >= :startDate
                  AND ss.date <= :endDate
                """;

        String sql = """
                SELECT
                    u.id as staffId,
                    u.full_name as staffName,
                    pos.name as position,
                    ss.branch_id as branchId,
                    b.name as branchName,
                    ss.id as shiftScheduleId,
                    ss.date as date,
                    st.name as shiftName,
                    st.start_time as shiftStartTime,
                    st.end_time as shiftEndTime,
                    st.start_time as expectedCheckinTime,
                    ss.actual_start_time as actualCheckinTime,
                    ss.actual_end_time as actualCheckoutTime,
                    COALESCE(ss.overtime_minutes, 0) as overtimeMinutes,
                    CASE
                        WHEN ss.status = 'ABSENT' THEN 'ABSENT'
                        WHEN ss.actual_start_time IS NULL THEN 'NO_CHECKIN'
                        WHEN ss.actual_start_time <= st.start_time THEN 'ON_TIME'
                        ELSE 'LATE'
                    END as checkinStatus,
                    ss.status as shiftStatus,
                    ss.note as notes
                FROM shift_schedules ss
                JOIN users u ON ss.user_id = u.id
                JOIN branches b ON ss.branch_id = b.id
                LEFT JOIN positions pos ON u.position_id = pos.id
                LEFT JOIN shift_templates st ON ss.shift_template_id = st.id
                WHERE ss.user_id = :staffId
                  AND ss.tenant_id = :tenantId
                  AND ss.branch_id = :branchId
                  AND ss.date >= :startDate
                  AND ss.date <= :endDate
                ORDER BY ss.date DESC
                LIMIT :limit OFFSET :offset
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("staffId", staffId);
        params.put("tenantId", tenantId);
        params.put("branchId", branchId);
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        params.put("limit", pageable.getPageSize());
        params.put("offset", pageable.getOffset());

        long total = jdbcTemplate.queryForObject(countSql, params, Long.class);

        List<CheckinHistoryDto> content = jdbcTemplate.query(sql, params, (rs, rowNum) -> {
            LocalTime actualIn = toLocalTime(rs.getObject("actualCheckinTime"));
            LocalTime actualOut = toLocalTime(rs.getObject("actualCheckoutTime"));
            Integer workingMins = null;
            if (actualIn != null && actualOut != null) {
                workingMins = (int) java.time.Duration.between(actualIn, actualOut).toMinutes();
            }

            return CheckinHistoryDto.builder()
                .staffId(toUUID(rs.getObject("staffId")))
                .staffName(rs.getString("staffName"))
                .position(rs.getString("position"))
                .branchId(toUUID(rs.getObject("branchId")))
                .branchName(rs.getString("branchName"))
                .shiftScheduleId(toUUID(rs.getObject("shiftScheduleId")))
                .date(toLocalDate(rs.getObject("date")))
                .shiftName(rs.getString("shiftName"))
                .shiftStartTime(toLocalTime(rs.getObject("shiftStartTime")))
                .shiftEndTime(toLocalTime(rs.getObject("shiftEndTime")))
                .expectedCheckinTime(toLocalTime(rs.getObject("expectedCheckinTime")))
                .actualCheckinTime(actualIn)
                .actualCheckoutTime(actualOut)
                .actualWorkingMinutes(workingMins)
                .overtimeMinutes(rs.getInt("overtimeMinutes"))
                .checkinStatus(rs.getString("checkinStatus"))
                .shiftStatus(rs.getString("shiftStatus"))
                .notes(rs.getString("notes"))
                .build();
        });

        return new PageImpl<>(content, pageable, total);
    }
}
