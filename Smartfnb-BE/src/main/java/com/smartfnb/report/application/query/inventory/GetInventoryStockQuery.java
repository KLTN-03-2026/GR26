package com.smartfnb.report.application.query.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Query để lấy báo cáo tồn kho hiện tại
 * 
 * @param branchId: Lọc theo chi nhánh (required)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetInventoryStockQuery {
    private UUID branchId;
    private UUID tenantId;  // Set by security context
}
