package com.smartfnb.report.application.query.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Query để lấy báo cáo chi phí hàng đã bán (COGS)
 * 
 * @param branchId: Lọc theo chi nhánh
 * @param startDate: Ngày bắt đầu
 * @param endDate: Ngày kết thúc
 * @param page: Trang (0-indexed)
 * @param pageSize: Số items per page (default 100, max 500)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetCogsQuery {
    private UUID branchId;
    private UUID tenantId;
    private LocalDate startDate;
    private LocalDate endDate;
    @lombok.Builder.Default
    private int page = 0;
    @lombok.Builder.Default
    private int pageSize = 100;
}
