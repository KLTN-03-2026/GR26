package com.smartfnb.report.application.query.handler.hr;

import com.smartfnb.report.application.dto.hr.CheckinHistoryDto;
import com.smartfnb.report.application.query.hr.GetCheckinHistoryQuery;
import com.smartfnb.report.domain.repository.HrReportRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

/**
 * Query handler: Lấy lịch sử check-in/out nhân viên
 * 
 * Thành phần của module S-19: Reports & Analytics
 * - Lấy chi tiết từng ca làm việc (expected vs actual check-in)
 * - Tính giờ làm việc và giờ OT
 * - Phân trang (mặc định page=0, pageSize=50)
 * - Cache: 30 phút (dữ liệu lịch sử ít thay đổi)
 * 
 * @author vutq
 * @since 2026-04
 */
@Slf4j
@Component
@AllArgsConstructor
public class GetCheckinHistoryQueryHandler {
    
    private final HrReportRepository repository;
    
    /**
     * Lấy lịch sử check-in/out nhân viên
     * 
     * @param query: GetCheckinHistoryQuery (staffId, tenantId, startDate, endDate, page, pageSize)
     * @return Page<CheckinHistoryDto> with detailed checkin records
     */
    // @Cacheable(
    //         value = "checkin_history",
    //         key = "#query.getStaffId().toString() + ':' + #query.startDate.toString() + ':' + #query.endDate.toString() + ':' + #query.page",
    //         cacheManager = "reportCacheManager"  // 30 min TTL
    // )
    public Page<CheckinHistoryDto> handle(GetCheckinHistoryQuery query) {
        log.info("Fetching checkin history: staff={}, period={} to {}, page={}",
                query.getStaffId(), query.getStartDate(), query.getEndDate(), query.getPage());
        
        // Validate: max 30 days per query
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(
                query.getStartDate(),
                query.getEndDate()
        );
        if (daysBetween > 30) {
            log.warn("Checkin history query exceeds 30-day limit: {} days", daysBetween);
            throw new IllegalArgumentException("Query period cannot exceed 30 days");
        }
        
        // Create pageable
        Pageable pageable = PageRequest.of(
                query.getPage(),
                query.getPageSize()
        );
        
        // Call repository
        Page<CheckinHistoryDto> history = repository.findCheckinHistory(
                query.getBranchId(),
                query.getStaffId(),
                query.getTenantId(),
                query.getStartDate(),
                query.getEndDate(),
                pageable
        );
        
        log.info("Found {} checkin records (page {}/{})",
                history.getNumberOfElements(),
                query.getPage(),
                history.getTotalPages());
        
        return history;
    }
}
