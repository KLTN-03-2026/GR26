package com.smartfnb.report.application.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * DTO cho báo cáo lịch sử check-in/out (S-19: Checkin History Report)
 * 
 * Business logic:
 * - Show tất cả check-in/out events của staff trong date range
 * - Paginated (100 per page max 500)
 * - Max 30 days query để tránh query quá lớn
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckinHistoryDto {
    
    // Staff info
    private UUID staffId;
    private String staffName;
    private String position;
    private UUID branchId;
    private String branchName;
    
    // Shift info
    private UUID shiftScheduleId;
    private LocalDate date;
    private String shiftName;             // VD: "Ca sáng 6h-14h"
    private LocalTime shiftStartTime;
    private LocalTime shiftEndTime;
    
    // Check-in/out times
    private LocalTime expectedCheckinTime;  // From shift_template
    private LocalTime actualCheckinTime;    // Thực tế check-in
    private LocalTime expectedCheckoutTime; // From shift_template
    private LocalTime actualCheckoutTime;   // Thực tế check-out
    
    // Calculated metrics
    private Integer actualWorkingMinutes;   // Thời gian làm việc thực tế
    private Integer overtimeMinutes;        // Thêm giờ làm việc
    private String checkinStatus;          // ON_TIME | LATE | ABSENT | EXCUSED
    
    // Shift status
    private String shiftStatus;            // SCHEDULED | CHECKED_IN | COMPLETED | ABSENT | CANCELLED
    
    // Notes
    private String notes;
}
