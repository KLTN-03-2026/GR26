package com.smartfnb.report.application.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO cho báo cáo nhập/xuất/tồn (S-19: Inventory Movement Report)
 * 
 * Business logic:
 * - Ending Balance = Beginning Balance + Import - Export
 * - Variance = Actual - Expected (for inventory count reconciliation)
 * - Grouping: daily | weekly | monthly
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryMovementDto {
    
    // Item info
    private UUID itemId;
    private String itemName;
    private String unit;
    
    // Balance metrics
    private Integer beginningBalance;      // Tồn đầu kỳ
    private Integer importQty;             // Nhập vào
    private Integer exportQty;             // Xuất ra (bán, hao hụt, etc.)
    private Integer endingBalance;         // Tồn cuối kỳ
    
    // Cost metrics
    private BigDecimal beginningValue;     // Giá trị tồn đầu kỳ
    private BigDecimal importValue;        // Giá trị nhập vào
    private BigDecimal exportValue;        // Giá trị xuất ra
    private BigDecimal endingValue;        // Giá trị tồn cuối kỳ
    
    // Variance (for counting reconciliation)
    private Integer variance;              // endingBalance - expected
    private String varianceStatus;         // OK | MISMATCH | CRITICAL
    
    // Period info
    private LocalDate date;                // For daily grouping
    private String week;                   // For weekly grouping: "W01-2026"
    private String month;                  // For monthly grouping: "2026-04"
    
    // Branch info
    private UUID branchId;
    private String branchName;
}
