package com.smartfnb.report.application.query.handler.inventory;

import com.smartfnb.report.application.dto.inventory.ExpiringItemsDto;
import com.smartfnb.report.application.query.inventory.GetExpiringItemsQuery;
import com.smartfnb.report.domain.repository.InventoryReportRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Query handler: Lấy danh sách hàng sắp hết hạn
 * 
 * Thành phần của module S-19: Reports & Analytics
 * - Lấy các mặt hàng có ngày hết hạn gần
 * - Áp dụng ngưỡng ngày (mặc định 7 ngày)
 * - Sắp xếp theo mức độ khẩn cấp (CRITICAL > WARNING)
 * - Cache: 1 giờ
 * 
 * @author vutq
 * @since 2026-04
 */
@Slf4j
@Component
@AllArgsConstructor
public class GetExpiringItemsQueryHandler {
    
    private final InventoryReportRepository repository;
    
    /**
     * Lấy danh sách hàng sắp hết hạn
     * 
     * @param query: GetExpiringItemsQuery (branchId, tenantId, daysThreshold=7)
     * @return List<ExpiringItemsDto> sorted by urgency (CRITICAL first)
     */
    // @Cacheable(
    //         value = "expiring_items",
    //         key = "#query.branchId.toString() + ':' + #query.daysThreshold",
    //         cacheManager = "reportCacheManager"  // 1 hour TTL
    // )
    public List<ExpiringItemsDto> handle(GetExpiringItemsQuery query) {
        log.info("Fetching expiring items for branch: {}, threshold: {} days",
                query.getBranchId(), query.getDaysThreshold());
        
        List<ExpiringItemsDto> expiringItems = repository.findExpiringItems(
                query.getBranchId(),
                query.getTenantId(),
                query.getDaysThreshold()
        );
        
        log.info("Found {} expiring items", expiringItems.size());
        return expiringItems;
    }
}
