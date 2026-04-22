package com.smartfnb.report.application.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO cho báo cáo chi phí hàng đã bán - COGS (S-19: Cost of Goods Sold)
 * 
 * Business logic:
 * - FIFO costing: OrderBy imported_at ASC để tính cost per unit đúng
 * - totalCost = qtyUsed × unitCost (cost per unit lấy từ batch import)
 * - Paginated report (100 per page max 500)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CogsDto {
    
    // Item info
    private UUID itemId;
    private String itemName;
    private String unit;
    
    // Transaction metrics
    private LocalDate date;
    private Integer qtyUsed;              // Lượng bán ra
    private BigDecimal unitCost;          // Giá vốn per unit (FIFO)
    private BigDecimal totalCost;         // qtyUsed * unitCost
    
    // Related info
    private String transactionType;       // SALE_DEDUCT | WASTAGE | ADJUSTMENT
    private UUID relatedOrderId;          // Nếu là SALE_DEDUCT
    private String notes;
    
    // Batch reference (for audit trail)
    private UUID batchId;
    private LocalDate batchImportedAt;
    
    // Branch info
    private UUID branchId;
    private String branchName;
}
