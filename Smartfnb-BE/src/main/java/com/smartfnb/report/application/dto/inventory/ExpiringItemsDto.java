package com.smartfnb.report.application.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO cho báo cáo hàng hóa sắp hết hạn (S-19: Expiring Items Report)
 * 
 * Business logic:
 * - Chỉ show items có expires_at trong 7 ngày tới
 * - Sắp xếp theo expiry date (gần nhất trước)
 * - Chỉ count quantity_remaining > 0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpiringItemsDto {
    
    // Item info
    private UUID itemId;
    private String itemName;
    private String unit;
    
    // Batch info
    private UUID batchId;
    private Integer quantityRemaining;
    private BigDecimal unitCost;
    
    // Expiry metrics
    private LocalDate expiryDate;
    private Integer daysToExpire;  // Calculated: EXTRACT(DAY FROM expires_at - NOW())
    private String urgency;        // CRITICAL (0-3 days) | WARNING (4-7 days)
    
    // Branch info
    private UUID branchId;
    private String branchName;
}
