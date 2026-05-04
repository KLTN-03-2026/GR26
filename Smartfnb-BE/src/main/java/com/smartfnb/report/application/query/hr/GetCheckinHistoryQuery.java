package com.smartfnb.report.application.query.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Query để lấy lịch sử check-in/out của staff
 * 
 * @param staffId: Staff ID
 * @param startDate: Ngày bắt đầu (max 30 days from endDate)
 * @param endDate: Ngày kết thúc
 * @param page: Trang (0-indexed)
 * @param pageSize: Số items per page (default 100, max 500)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetCheckinHistoryQuery {
    private UUID staffId;
    private UUID tenantId;
    private UUID branchId;
    private LocalDate startDate;
    private LocalDate endDate;
    @lombok.Builder.Default
    private int page = 0;
    @lombok.Builder.Default
    private int pageSize = 100;
}
