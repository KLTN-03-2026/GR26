package com.smartfnb.report.application.dto.hr;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO cho báo cáo chấm công (S-19: Attendance Report)
 * 
 * Java 21 Record - immutable and thread-safe by design
 * 
 * Business logic:
 * - working_days = COUNT(shifts WHERE status='COMPLETED')
 * - Exclude: SCHEDULED, ABSENT, CANCELLED shifts
 * - overtime_hours = SUM(overtime_minutes / 60)
 */
public record AttendanceReportDto(
    // Staff info
    UUID staffId,
    String staffName,
    String position,
    String positionId,
    
    // Attendance metrics
    Integer workingDays,           // Số ngày làm việc hoàn thành
    BigDecimal overtimeHours,      // Số giờ OT
    Integer absentDays,            // Số ngày vắng mặt
    Integer leaveDays,             // Số ngày phép
    
    // Period info
    String month,                  // YYYY-MM
    Integer daysInMonth,           // Tổng ngày trong tháng
    Integer attendancePercentage,  // working_days / daysInMonth * 100
    
    // Branch info
    UUID branchId,
    String branchName
) {
    // Factory method for compatibility with existing @Builder usage
    public static AttendanceReportDto.Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID staffId;
        private String staffName;
        private String position;
        private String positionId;
        private Integer workingDays;
        private BigDecimal overtimeHours;
        private Integer absentDays;
        private Integer leaveDays;
        private String month;
        private Integer daysInMonth;
        private Integer attendancePercentage;
        private UUID branchId;
        private String branchName;

        public Builder staffId(UUID staffId) { this.staffId = staffId; return this; }
        public Builder staffName(String staffName) { this.staffName = staffName; return this; }
        public Builder position(String position) { this.position = position; return this; }
        public Builder positionId(String positionId) { this.positionId = positionId; return this; }
        public Builder workingDays(Integer workingDays) { this.workingDays = workingDays; return this; }
        public Builder overtimeHours(BigDecimal overtimeHours) { this.overtimeHours = overtimeHours; return this; }
        public Builder absentDays(Integer absentDays) { this.absentDays = absentDays; return this; }
        public Builder leaveDays(Integer leaveDays) { this.leaveDays = leaveDays; return this; }
        public Builder month(String month) { this.month = month; return this; }
        public Builder daysInMonth(Integer daysInMonth) { this.daysInMonth = daysInMonth; return this; }
        public Builder attendancePercentage(Integer attendancePercentage) { this.attendancePercentage = attendancePercentage; return this; }
        public Builder branchId(UUID branchId) { this.branchId = branchId; return this; }
        public Builder branchName(String branchName) { this.branchName = branchName; return this; }

        public AttendanceReportDto build() {
            return new AttendanceReportDto(
                staffId, staffName, position, positionId,
                workingDays, overtimeHours, absentDays, leaveDays,
                month, daysInMonth, attendancePercentage,
                branchId, branchName
            );
        }
    }
}
