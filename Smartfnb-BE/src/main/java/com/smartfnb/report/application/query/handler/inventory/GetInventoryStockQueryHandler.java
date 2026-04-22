package com.smartfnb.report.application.query.handler.inventory;

import com.smartfnb.report.application.dto.inventory.InventoryStockDto;
import com.smartfnb.report.application.query.inventory.GetInventoryStockQuery;
import com.smartfnb.report.domain.repository.InventoryReportRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Handler để xử lý GetInventoryStockQuery
 * 
 * - CQRS pattern: Query -> Handler -> Repository -> DTO
 * - Cached với TTL 5 phút (stock thay đổi thường xuyên)
 * - RBAC: Branch filter automatically applied via TenantContext
 */
@Slf4j
@Component
@AllArgsConstructor
public class GetInventoryStockQueryHandler {
    
    private final InventoryReportRepository repository;
    
    /**
     * Lấy báo cáo tồn kho hiện tại
     * 
     * @param query: GetInventoryStockQuery
     * @return List<InventoryStockDto> with status calculated
     */
    // @Cacheable(
    //         value = "inv_stock",
    //         key = "#query.branchId.toString()",
    //         cacheManager = "shortCacheManager"  // 5 min TTL
    // )
    public List<InventoryStockDto> handle(GetInventoryStockQuery query) {
        log.info("Fetching inventory stock for branch: {}", query.getBranchId());
        
        // Validate query
        if (query.getBranchId() == null) {
            throw new IllegalArgumentException("branchId is required");
        }
        
        // Call repository to fetch data
        List<InventoryStockDto> stocks = repository.findStockByBranch(
                query.getBranchId(),
                query.getTenantId()
        );
        
        log.info("Found {} items in stock for branch {}", stocks.size(), query.getBranchId());
        return stocks;
    }
}
