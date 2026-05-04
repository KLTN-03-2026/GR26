package com.smartfnb.report.application.query.handler.inventory;

import com.smartfnb.report.application.dto.inventory.WasteReportDto;
import com.smartfnb.report.application.query.inventory.GetWasteReportQuery;
import com.smartfnb.report.domain.repository.InventoryReportRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Query handler: Lấy báo cáo lãng phí thực phẩm
 * 
 * Thành phần của module S-19: Reports & Analytics
 * - Tính toán % lãng phí so với tổng nhập
 * - So sánh với benchmark (GOOD/MEDIUM/POOR)
 * - Phân loại nguyên nhân lãng phí
 * - Cache: 3 giờ (ít thay đổi)
 * 
 * @author vutq
 * @since 2026-04
 */
@Slf4j
@Component
@AllArgsConstructor
public class GetWasteReportQueryHandler {
    
    private final InventoryReportRepository repository;
    
    /**
     * Lấy báo cáo lãng phí thực phẩm
     * 
     * @param query: GetWasteReportQuery (branchId, tenantId, startDate, endDate)
     * @return List<WasteReportDto> with waste metrics and categorization
     */
    public List<WasteReportDto> handle(GetWasteReportQuery query) {
        log.info("Fetching waste report: branch={}, period={} to {}",
                query.getBranchId(), query.getStartDate(), query.getEndDate());
        
        List<WasteReportDto> wasteReport = repository.findWasteReport(
                query.getBranchId(),
                query.getTenantId(),
                query.getStartDate(),
                query.getEndDate()
        );
        
        log.info("Waste report: {} items with waste data", wasteReport.size());
        return wasteReport;
    }
}
