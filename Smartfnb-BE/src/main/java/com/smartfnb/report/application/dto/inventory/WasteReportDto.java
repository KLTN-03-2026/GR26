package com.smartfnb.report.application.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO cho báo cáo hao hụt hàng hóa (S-19: Waste Report)
 * 
 * Business logic:
 * - wastePercentage = (totalWasteCost / totalPurchaseCost) × 100
 * - Benchmarking:
 *   - < 3%: GOOD
 *   - 3-8%: MEDIUM (cần kiểm tra)
 *   - > 8%: POOR (cần audit)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WasteReportDto {
    
    // Item info
    private UUID itemId;
    private String itemName;
    private String unit;
    
    // Waste metrics
    private Integer totalWasteQty;
    private BigDecimal totalWasteCost;
    private BigDecimal wastePercentage;    // Tính dựa trên PURCHASE_COST
    
    // Benchmark
    private String benchmark;  // GOOD | MEDIUM | POOR
    
    // Reasons breakdown (JSON object hoặc list separate)
    private String primaryReason;          // SPOIL | DAMAGE | FORMULA_ERROR | EXPIRED | OTHER
    private Integer reasonCount;           // Số lần hao hụt
    
    // Period info
    private String periodFrom;
    private String periodTo;
    
    // Branch info
    private UUID branchId;
    private String branchName;
}
