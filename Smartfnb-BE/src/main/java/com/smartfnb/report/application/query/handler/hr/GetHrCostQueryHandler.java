package com.smartfnb.report.application.query.handler.hr;

import com.smartfnb.report.application.dto.hr.HrCostReportDto;
import com.smartfnb.report.application.query.hr.GetHrCostQuery;
import com.smartfnb.report.domain.repository.HrReportRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

/**
 * Query handler: Lấy báo cáo chi phí nhân sự
 * 
 * Thành phần của module S-19: Reports & Analytics
 * - Tính tổng chi phí nhân sự theo tháng
 * - Tính các thành phần: lương cơ bản, OT, khác
 * - Tính chi phí per staff
 * - Cache: 1 giờ (aggregation ít thay đổi)
 * 
 * @author vutq
 * @since 2026-04
 */
@Slf4j
@Component
@AllArgsConstructor
public class GetHrCostQueryHandler {
    
    private final HrReportRepository repository;
    
    /**
     * Lấy báo cáo chi phí nhân sự
     * 
     * @param query: GetHrCostQuery (branchId, tenantId, month)
     * @return HrCostReportDto with aggregated HR costs
     */
    // @Cacheable(
    //         value = "hr_cost_report",
    //         key = "#query.branchId.toString() + ':' + #query.month.toString()",
    //         cacheManager = "reportCacheManager"  // 1 hour TTL
    // )
    public HrCostReportDto handle(GetHrCostQuery query) {
        log.info("Fetching HR cost report: branch={}, month={}",
                query.getBranchId(), query.getMonth());
        
        HrCostReportDto hrCost = repository.findHrCost(
                query.getBranchId(),
                query.getTenantId(),
                query.getMonth()
        );
        
        log.info("HR cost report: totalStaff={}, totalCost={}",
                hrCost.totalStaff(), hrCost.totalHrCost());
        
        return hrCost;
    }
}
