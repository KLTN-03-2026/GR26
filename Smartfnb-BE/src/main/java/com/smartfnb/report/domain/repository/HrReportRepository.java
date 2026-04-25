package com.smartfnb.report.domain.repository;

import com.smartfnb.report.application.dto.hr.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface cho HR Reports (S-19)
 * 
 * Dùng CQRS pattern: Query-only
 * Implement native SQL queries cho complex business logic
 */
public interface HrReportRepository {
    
    /**
     * Lấy báo cáo chấm công theo tháng
     * 
     * Business Logic:
     * - working_days = COUNT(shifts WHERE status='COMPLETED')
     * - overtime_hours = SUM(overtime_minutes / 60)
     * - Exclude: SCHEDULED, ABSENT, CANCELLED shifts
     * 
     * @param branchId: Chi nhánh
     * @param tenantId: Tenant
     * @param month: Tháng (YearMonth.of(2026, 4))
     * @return List of AttendanceReportDto
     */
    List<AttendanceReportDto> findAttendanceReport(
            UUID branchId,
            UUID tenantId,
            YearMonth month);
    
    /**
     * Lấy báo cáo vi phạm giờ công
     * 
     * Business Logic:
     * - LATE_CHECKIN: checked_in_at > shift_start_time + 15 minutes
     * - EARLY_CHECKOUT: checked_out_at < shift_end_time - 15 minutes
     * 
     * @param branchId: Chi nhánh
     * @param tenantId: Tenant
     * @param startDate: Ngày bắt đầu
     * @param endDate: Ngày kết thúc
     * @param pageable: Pagination (50 per page recommended)
     * @return Page of ViolationReportDto
     */
    Page<ViolationReportDto> findViolations(
            UUID branchId,
            UUID tenantId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable);
    
    /**
     * Lấy báo cáo lương tháng
     * 
     * 🔒 PRIVACY: Caller phải validate:
     *    - If STAFF role: staffId phải = currentUserId
     *    - If ADMIN/OWNER: có thể query bất kỳ staff
     * 
     * Business Logic:
     * - gross_salary = base_salary + overtime_pay + bonus - deductions
     * - overtime_pay = (base_salary / 160) * 1.5 * overtime_hours
     * 
     * @param branchId: Chi nhánh
     * @param tenantId: Tenant
     * @param month: Tháng
     * @param staffId: Staff ID (optional for ADMIN, required for STAFF)
     * @return List of PayrollReportDto
     */
    List<PayrollReportDto> findPayroll(
            UUID branchId,
            UUID tenantId,
            YearMonth month,
            UUID staffId);  // null = all staff in branch
    
    /**
     * Lấy báo cáo tổng chi phí nhân sự theo tháng
     * 
     * @param branchId: Chi nhánh
     * @param tenantId: Tenant
     * @param month: Tháng
     * @return HrCostReportDto with aggregated costs
     */
    HrCostReportDto findHrCost(
            UUID branchId,
            UUID tenantId,
            YearMonth month);
    
    /**
     * Lấy lịch sử check-in/out của staff
     * 
     * @param staffId: Staff ID
     * @param tenantId: Tenant
     * @param startDate: Ngày bắt đầu (max 30 days from endDate)
     * @param endDate: Ngày kết thúc
     * @param pageable: Pagination (100 per page recommended)
     * @return Page of CheckinHistoryDto sorted by date DESC
     */
    Page<CheckinHistoryDto> findCheckinHistory(
            UUID branchId,
            UUID staffId,
            UUID tenantId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable);
}
