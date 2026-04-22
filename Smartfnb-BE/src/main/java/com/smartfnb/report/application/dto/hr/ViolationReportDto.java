package com.smartfnb.report.application.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * DTO cho báo cáo vi phạm giờ công (S-19: Violation Report)
 * 
 * Business logic:
 * - Detect late check-in: checked_in_at > shift_start_time + 15 minutes
 * - Detect early check-out: checked_out_at < shift_end_time - 15 minutes
 * - Paginated report (50 per page max 200)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViolationReportDto {
    
    // Staff info
    private UUID staffId;
    private String staffName;
    private String position;
    
    // Violation info
    private LocalDate date;
    private String shiftName;             // VD: "Ca sáng 6h-14h"
    private LocalTime shiftStartTime;
    private LocalTime shiftEndTime;
    
    // Violation details
    private String violationType;         // LATE_CHECKIN | EARLY_CHECKOUT
    private Integer minutesViolation;     // Số phút trễ/sớm
    private LocalTime actualCheckinTime;
    private LocalTime actualCheckoutTime;
    
    // Notes for tracking
    private String reason;                // VD: "Traffic", "Personal reason", etc.
    private Boolean isExcused;            // Có được miễn trừ?
    
    // Branch info
    private UUID branchId;
    private String branchName;
}
