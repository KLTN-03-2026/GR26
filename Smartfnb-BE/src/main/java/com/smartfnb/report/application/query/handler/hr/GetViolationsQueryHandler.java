package com.smartfnb.report.application.query.handler.hr;

import com.smartfnb.report.application.dto.hr.ViolationReportDto;
import com.smartfnb.report.application.query.hr.GetViolationsQuery;
import com.smartfnb.report.domain.repository.HrReportRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

/**
 * Query handler: Lấy báo cáo vi phạm check-in
 * 
 * Thành phần của module S-19: Reports & Analytics
 * - Lấy danh sách nhân viên đi muộn / về sớm
 * - Phân loại loại vi phạm (LATE_CHECKIN, EARLY_CHECKOUT)
 * - Hiển thị phút vi phạm và lý do miễn trừ
 * - Phân trang (mặc định page=0, pageSize=50)
 * - Cache: 15 phút (thay đổi liên tục)
 * 
 * @author SmartF&B Team
 * @since 2026-04
 */
@Slf4j
@Component
@AllArgsConstructor
public class GetViolationsQueryHandler {
    
    private final HrReportRepository repository;
    
    /**
     * Lấy báo cáo vi phạm check-in
     * 
     * @param query: GetViolationsQuery (branchId, startDate, endDate, page, pageSize)
     * @return Page<ViolationReportDto> with violation details
     */
    // @Cacheable(
    //         value = "violations_report",
    //         key = "#query.branchId.toString() + ':' + #query.startDate.toString() + ':' + #query.endDate.toString() + ':' + #query.page",
    //         cacheManager = "reportCacheManager"  // 15 min TTL
    // )
    public Page<ViolationReportDto> handle(GetViolationsQuery query) {
        log.info("Fetching violations: branch={}, period={} to {}, page={}",
                query.getBranchId(), query.getStartDate(), query.getEndDate(), query.getPage());
        
        // Create pageable
        Pageable pageable = PageRequest.of(
                query.getPage(),
                query.getPageSize()
        );
        
        // Call repository
        Page<ViolationReportDto> violations = repository.findViolations(
                query.getBranchId(),
                query.getTenantId(),
                query.getStartDate(),
                query.getEndDate(),
                pageable
        );
        
        log.info("Found {} violations (page {}/{})",
                violations.getNumberOfElements(),
                query.getPage(),
                violations.getTotalPages());
        
        return violations;
    }
}
