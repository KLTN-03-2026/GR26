package com.smartfnb.report.application.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO cho báo cáo tồn kho hiện tại (S-19: Inventory Stock Report)
 * 
 * Business logic:
 * - Status được tính dựa trên quantity vs min_level
 * - ENOUGH: quantity > min_level
 * - LOW: 0 < quantity <= min_level
 * - OUT_OF_STOCK: quantity = 0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryStockDto {
    
    // Item info
    private UUID itemId;
    private String itemName;
    private String unit;           // kg, lít, cái, etc.
    
    // Stock metrics
    private Integer currentQty;
    private Integer minLevel;
    private BigDecimal unitCost;
    
    // Calculated field
    private String status;         // ENOUGH | LOW | OUT_OF_STOCK
    private BigDecimal totalValue; // Sum(qty * cost) per batch
    private java.time.LocalDate nearestExpiryDate;
    
    // Metadata
    private UUID branchId;
    private String branchName;
}
