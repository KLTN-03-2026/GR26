package com.smartfnb.report.application.query.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Query để lấy báo cáo vi phạm giờ công
 * 
 * @param branchId: Lọc theo chi nhánh
 * @param startDate: Ngày bắt đầu
 * @param endDate: Ngày kết thúc (max 30 days)
 * @param page: Trang (0-indexed)
 * @param pageSize: Số items per page (default 50, max 200)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetViolationsQuery {
    private UUID branchId;
    private UUID tenantId;
    private String violationType;
    private UUID staffId;
    private LocalDate startDate;
    private LocalDate endDate;
    @lombok.Builder.Default
    private int page = 0;
    @lombok.Builder.Default
    private int pageSize = 50;
}
