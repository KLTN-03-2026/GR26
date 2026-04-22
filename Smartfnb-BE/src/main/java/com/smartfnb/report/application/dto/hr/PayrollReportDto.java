package com.smartfnb.report.application.dto.hr;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO cho báo cáo lương tháng (S-19: Payroll Report)
 * 
 * Java 21 Record - immutable and thread-safe by design
 * 
 * 🔒 CRITICAL SECURITY:
 * - Staff CAN ONLY view own payroll (validated at application layer)
 * - OWNER/ADMIN can view all staff payroll
 * - All payroll access MUST be audit logged
 * 
 * Business logic:
 * - gross_salary = base_salary + overtime_pay + bonus - deductions
 * - overtime_pay = (base_salary / 160) × 1.5 × overtime_hours
 * - 160 hours = 20 working days × 8 hours/day
 */
public record PayrollReportDto(
    // Staff info
    UUID staffId,
    String staffName,
    String position,
    UUID branchId,
    String branchName,
    
    // Payroll period
    String month,                  // YYYY-MM
    
    // Salary components
    BigDecimal baseSalary,
    Integer workingDays,
    BigDecimal overtimeHours,
    BigDecimal overtimePay,        // (base_salary/160) * 1.5 * overtime_hours
    
    // Additions
    BigDecimal totalBonuses,       // Thưởng hiệu suất, chấm công, etc.
    
    // Deductions
    BigDecimal totalDeductions,    // Bảo hiểm, thuế, advance, etc.
    
    // Final calculation
    BigDecimal grossSalary,        // base + OT + bonus - deductions
    
    // Status tracking
    String status,                 // DRAFT | SUBMITTED | APPROVED | PAID | REJECTED
    String approvedBy,
    String paidAt,
    String paymentMethod,          // BANK_TRANSFER | CASH
    
    // Audit info
    String createdAt,
    String updatedAt
) {
    // Factory method for compatibility with existing @Builder usage
    public static PayrollReportDto.Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID staffId;
        private String staffName;
        private String position;
        private UUID branchId;
        private String branchName;
        private String month;
        private BigDecimal baseSalary;
        private Integer workingDays;
        private BigDecimal overtimeHours;
        private BigDecimal overtimePay;
        private BigDecimal totalBonuses;
        private BigDecimal totalDeductions;
        private BigDecimal grossSalary;
        private String status;
        private String approvedBy;
        private String paidAt;
        private String paymentMethod;
        private String createdAt;
        private String updatedAt;

        public Builder staffId(UUID staffId) { this.staffId = staffId; return this; }
        public Builder staffName(String staffName) { this.staffName = staffName; return this; }
        public Builder position(String position) { this.position = position; return this; }
        public Builder branchId(UUID branchId) { this.branchId = branchId; return this; }
        public Builder branchName(String branchName) { this.branchName = branchName; return this; }
        public Builder month(String month) { this.month = month; return this; }
        public Builder baseSalary(BigDecimal baseSalary) { this.baseSalary = baseSalary; return this; }
        public Builder workingDays(Integer workingDays) { this.workingDays = workingDays; return this; }
        public Builder overtimeHours(BigDecimal overtimeHours) { this.overtimeHours = overtimeHours; return this; }
        public Builder overtimePay(BigDecimal overtimePay) { this.overtimePay = overtimePay; return this; }
        public Builder totalBonuses(BigDecimal totalBonuses) { this.totalBonuses = totalBonuses; return this; }
        public Builder totalDeductions(BigDecimal totalDeductions) { this.totalDeductions = totalDeductions; return this; }
        public Builder grossSalary(BigDecimal grossSalary) { this.grossSalary = grossSalary; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder approvedBy(String approvedBy) { this.approvedBy = approvedBy; return this; }
        public Builder paidAt(String paidAt) { this.paidAt = paidAt; return this; }
        public Builder paymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; return this; }
        public Builder createdAt(String createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(String updatedAt) { this.updatedAt = updatedAt; return this; }

        public PayrollReportDto build() {
            return new PayrollReportDto(
                staffId, staffName, position, branchId, branchName,
                month, baseSalary, workingDays, overtimeHours, overtimePay,
                totalBonuses, totalDeductions, grossSalary,
                status, approvedBy, paidAt, paymentMethod,
                createdAt, updatedAt
            );
        }
    }
}
