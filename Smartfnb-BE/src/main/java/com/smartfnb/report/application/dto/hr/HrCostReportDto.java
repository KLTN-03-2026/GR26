package com.smartfnb.report.application.dto.hr;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO cho báo cáo tổng chi phí nhân sự (S-19: HR Cost Report)
 * 
 * Java 21 Record - immutable and thread-safe by design
 * 
 * Business logic:
 * - Tính tổng lương cho từng branch/month
 * - Includes: base salary + overtime pay
 * - Group by: month + branch
 */
public record HrCostReportDto(
    // Branch info
    UUID branchId,
    String branchName,
    
    // Period info
    String month,                  // YYYY-MM
    
    // HR metrics
    Integer totalStaff,            // Số NV làm việc trong tháng
    Integer totalShifts,           // Tổng số ca làm việc
    Long totalWorkingHours,        // Tổng số giờ làm việc
    
    // Cost breakdown
    BigDecimal baseSalaryCost,     // Tổng lương cơ bản
    BigDecimal overtimeCost,       // Tổng lương OT
    BigDecimal bonusCost,          // Tổng thưởng
    BigDecimal deductionsCost,     // Tổng khấu trừ
    
    // Final total
    BigDecimal totalHrCost,        // base + OT + bonus - deductions
    
    // Cost per unit metrics
    BigDecimal costPerStaff,       // total_hr_cost / total_staff
    BigDecimal costPerShift,       // total_hr_cost / total_shifts
    
    // Comparison with previous month (optional)
    BigDecimal previousMonthCost,
    BigDecimal costChange,         // Thay đổi so với tháng trước
    String costTrend               // UP | DOWN | STABLE
) {
    // Factory method for compatibility with existing @Builder usage
    public static HrCostReportDto.Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID branchId;
        private String branchName;
        private String month;
        private Integer totalStaff;
        private Integer totalShifts;
        private Long totalWorkingHours;
        private BigDecimal baseSalaryCost;
        private BigDecimal overtimeCost;
        private BigDecimal bonusCost;
        private BigDecimal deductionsCost;
        private BigDecimal totalHrCost;
        private BigDecimal costPerStaff;
        private BigDecimal costPerShift;
        private BigDecimal previousMonthCost;
        private BigDecimal costChange;
        private String costTrend;

        public Builder branchId(UUID branchId) { this.branchId = branchId; return this; }
        public Builder branchName(String branchName) { this.branchName = branchName; return this; }
        public Builder month(String month) { this.month = month; return this; }
        public Builder totalStaff(Integer totalStaff) { this.totalStaff = totalStaff; return this; }
        public Builder totalShifts(Integer totalShifts) { this.totalShifts = totalShifts; return this; }
        public Builder totalWorkingHours(Long totalWorkingHours) { this.totalWorkingHours = totalWorkingHours; return this; }
        public Builder baseSalaryCost(BigDecimal baseSalaryCost) { this.baseSalaryCost = baseSalaryCost; return this; }
        public Builder overtimeCost(BigDecimal overtimeCost) { this.overtimeCost = overtimeCost; return this; }
        public Builder bonusCost(BigDecimal bonusCost) { this.bonusCost = bonusCost; return this; }
        public Builder deductionsCost(BigDecimal deductionsCost) { this.deductionsCost = deductionsCost; return this; }
        public Builder totalHrCost(BigDecimal totalHrCost) { this.totalHrCost = totalHrCost; return this; }
        public Builder costPerStaff(BigDecimal costPerStaff) { this.costPerStaff = costPerStaff; return this; }
        public Builder costPerShift(BigDecimal costPerShift) { this.costPerShift = costPerShift; return this; }
        public Builder previousMonthCost(BigDecimal previousMonthCost) { this.previousMonthCost = previousMonthCost; return this; }
        public Builder costChange(BigDecimal costChange) { this.costChange = costChange; return this; }
        public Builder costTrend(String costTrend) { this.costTrend = costTrend; return this; }

        public HrCostReportDto build() {
            return new HrCostReportDto(
                branchId, branchName, month,
                totalStaff, totalShifts, totalWorkingHours,
                baseSalaryCost, overtimeCost, bonusCost, deductionsCost,
                totalHrCost, costPerStaff, costPerShift,
                previousMonthCost, costChange, costTrend
            );
        }
    }
}
