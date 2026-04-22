package com.smartfnb.report.application.query.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Query để lấy danh sách hàng hóa sắp hết hạn
 * 
 * @param branchId: Lọc theo chi nhánh
 * @param daysThreshold: Ngưỡng ngày (default 7)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetExpiringItemsQuery {
    private UUID branchId;
    private UUID tenantId;
    @lombok.Builder.Default
    private int daysThreshold = 7;  // Mặc định 7 ngày
}
