package com.smartfnb.report.application.query.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.YearMonth;
import java.util.UUID;

/**
 * Query để lấy báo cáo tổng chi phí nhân sự
 * 
 * @param branchId: Lọc theo chi nhánh
 * @param month: Tháng (YYYY-MM format)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetHrCostQuery {
    private UUID branchId;
    private UUID tenantId;
    private YearMonth month;
}
