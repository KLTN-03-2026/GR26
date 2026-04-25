package com.smartfnb.report.application.query.handler.inventory;

import com.smartfnb.report.application.dto.inventory.CogsDto;
import com.smartfnb.report.application.query.inventory.GetCogsQuery;
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
 * Query handler: Lấy báo cáo giá vốn hàng bán (COGS)
 * 
 * Thành phần của module S-19: Reports & Analytics
 * - Tính giá vốn FIFO: sử dụng nguyên tắc First In First Out
 * - Tính COGS = Qty * Unit Cost (FIFO)
 * - Phân trang kết quả (mặc định page=0, pageSize=50)
 * - Cache: 1 giờ (phụ thuộc vào doanh số)
 * 
 * @author vutq
 * @since 2026-04
 */
@Slf4j
@Component
@AllArgsConstructor
public class GetCogsQueryHandler {
    
    private final InventoryReportRepository repository;
    
    /**
     * Lấy báo cáo COGS (Cost of Goods Sold)
     * 
     * @param query: GetCogsQuery (branchId, tenantId, startDate, endDate)
     * @return Page<CogsDto> with FIFO-based unit costs
     */
    @Cacheable(
            value = ReportCacheNames.INVENTORY_COGS,
            key = "#query.branchId.toString() + ':' + #query.startDate.toString() + ':' + #query.endDate.toString() + ':' + #query.page",
            cacheManager = "reportCacheManager"  // 1 hour TTL
    )
    public Page<CogsDto> handle(GetCogsQuery query) {
        log.info("Fetching COGS report: branch={}, period={} to {}, page={}",
                query.getBranchId(), query.getStartDate(), query.getEndDate(), query.getPage());
        
        // Create pageable
        Pageable pageable = PageRequest.of(
                query.getPage(),
                query.getPageSize()
        );
        
        // Call repository - applies FIFO ordering
        Page<CogsDto> cogsData = repository.findCogs(
                query.getBranchId(),
                query.getTenantId(),
                query.getStartDate(),
                query.getEndDate(),
                pageable
        );
        
        log.info("COGS report: {} items (page {}/{})",
                cogsData.getNumberOfElements(),
                query.getPage(),
                cogsData.getTotalPages());
        
        return cogsData;
    }
}
