package com.smartfnb.report.application.query.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Query để lấy báo cáo hao hụt hàng hóa
 * 
 * @param branchId: Lọc theo chi nhánh
 * @param startDate: Ngày bắt đầu
 * @param endDate: Ngày kết thúc
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetWasteReportQuery {
    private UUID branchId;
    private UUID tenantId;
    private LocalDate startDate;
    private LocalDate endDate;
}
