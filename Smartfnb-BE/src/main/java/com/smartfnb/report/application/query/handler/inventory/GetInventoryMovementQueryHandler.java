package com.smartfnb.report.application.query.handler.inventory;

import com.smartfnb.report.application.dto.inventory.InventoryMovementDto;
import com.smartfnb.report.application.query.inventory.GetInventoryMovementQuery;
import com.smartfnb.report.domain.repository.InventoryReportRepository;
import com.smartfnb.report.infrastructure.config.ReportCacheNames;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

/**
 * Query handler: Lấy báo cáo chuyển động kho hàng
 * 
 * Thành phần của module S-19: Reports & Analytics
 * - Lấy chi tiết nhập/xuất/tồn kho theo khoảng thời gian
 * - Grouping by: daily/weekly/monthly
 * - Phân trang: mặc định page=0, pageSize=50
 * - Cache: 2 giờ
 * 
 * @author vutq
 * @since 2026-04
 */
@Slf4j
@Component
@AllArgsConstructor
public class GetInventoryMovementQueryHandler {
    
    private final InventoryReportRepository repository;
    
    /**
     * Lấy báo cáo chuyển động kho hàng
     * 
     * @param query: GetInventoryMovementQuery (branchId, startDate, endDate, groupBy)
     * @return Page<InventoryMovementDto> grouped by period
     */
    @Cacheable(
            value = ReportCacheNames.INVENTORY_MOVEMENT,
            key = "#query.branchId.toString() + ':' + #query.startDate.toString() + ':' + #query.endDate.toString() + ':' + #query.getGroupBy() + ':' + #query.page",
            cacheManager = "reportCacheManager"  // 2 hours TTL
    )
    public Page<InventoryMovementDto> handle(GetInventoryMovementQuery query) {
        log.info("Fetching inventory movement: branch={}, period={} to {}, groupBy={}",
                query.getBranchId(), query.getStartDate(), query.getEndDate(), query.getGroupBy());
        
        // Create pageable
        Pageable pageable = PageRequest.of(
                query.getPage(),
                query.getPageSize()
        );
        
        // Call repository
        Page<InventoryMovementDto> movements = repository.findInventoryMovement(
                query.getBranchId(),
                query.getTenantId(),
                query.getStartDate(),
                query.getEndDate(),
                query.getGroupBy(),
                pageable
        );
        
        log.info("Found {} inventory movements (page {}/{})",
                movements.getNumberOfElements(),
                query.getPage(),
                movements.getTotalPages());
        
        return movements;
    }
}
