package com.smartfnb.report.application.query.handler.hr;

import com.smartfnb.report.application.dto.hr.AttendanceReportDto;
import com.smartfnb.report.application.query.hr.GetAttendanceReportQuery;
import com.smartfnb.report.domain.repository.HrReportRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * Handler để xử lý GetAttendanceReportQuery
 * 
 * Business Logic:
 * - working_days = COUNT(shifts WHERE status='COMPLETED')
 * - Exclude: SCHEDULED, ABSENT, CANCELLED shifts
 * - overtime_hours = SUM(overtime_minutes / 60)
 * - Cached 1 hour (monthly data, doesn't change after month ends)
 */
@Slf4j
@Component
@AllArgsConstructor
public class GetAttendanceReportQueryHandler {
    
    private final HrReportRepository repository;
    
    /**
     * Lấy báo cáo chấm công theo tháng
     * 
     * @param query: GetAttendanceReportQuery
     * @return List<AttendanceReportDto> for all staff in branch
     */
    // @Cacheable(
    //         value = "attendance_report",
    //         key = "#query.branchId.toString() + ':' + #query.month.toString()",
    //         cacheManager = "mediumCacheManager"  // 1 hour TTL
    // )
    public List<AttendanceReportDto> handle(GetAttendanceReportQuery query) {
        log.info("Fetching attendance report for branch: {}, month: {}",
                query.getBranchId(), query.getMonth());
        
        // Validate query
        if (query.getBranchId() == null) {
            throw new IllegalArgumentException("branchId is required");
        }
        if (query.getMonth() == null) {
            throw new IllegalArgumentException("month is required");
        }
        
        // Prevent future queries
        if (query.getMonth().isAfter(YearMonth.now())) {
            throw new IllegalArgumentException("Cannot query future months");
        }
        
        // Call repository
        List<AttendanceReportDto> attendance = repository.findAttendanceReport(
                query.getBranchId(),
                query.getTenantId(),
                query.getMonth()
        );
        
        log.info("Found {} staff attendance records for {}", attendance.size(), query.getMonth());
        return attendance;
    }
}
