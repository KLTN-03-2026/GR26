package com.smartfnb.report.domain.repository;

import com.smartfnb.report.application.dto.inventory.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface cho Inventory Reports (S-19)
 * 
 * Dùng CQRS pattern: Query-only (no CommandHandler)
 * Implement native SQL queries cho performance
 */
public interface InventoryReportRepository {
    
    /**
     * Lấy báo cáo tồn kho hiện tại
     * 
     * @param branchId: Chi nhánh
     * @param tenantId: Tenant (for multi-tenant isolation)
     * @return List of InventoryStockDto with status calculated
     */
    List<InventoryStockDto> findStockByBranch(UUID branchId, UUID tenantId);
    
    /**
     * Lấy danh sách hàng hóa sắp hết hạn
     * 
     * @param branchId: Chi nhánh
     * @param tenantId: Tenant
     * @param daysThreshold: Số ngày để lấy (VD: 7)
     * @return List sắp xếp theo expiry date (gần nhất trước)
     */
    List<ExpiringItemsDto> findExpiringItems(UUID branchId, UUID tenantId, int daysThreshold);
    
    /**
     * Lấy báo cáo nhập/xuất/tồn
     * 
     * @param branchId: Chi nhánh
     * @param tenantId: Tenant
     * @param startDate: Ngày bắt đầu
     * @param endDate: Ngày kết thúc
     * @param groupBy: Cách nhóm (daily | weekly | monthly)
     * @param pageable: Pagination info
     * @return Page of InventoryMovementDto
     */
    Page<InventoryMovementDto> findInventoryMovement(
            UUID branchId,
            UUID tenantId,
            LocalDate startDate,
            LocalDate endDate,
            String groupBy,
            Pageable pageable);
    
    /**
     * Lấy báo cáo hao hụt
     * 
     * @param branchId: Chi nhánh
     * @param tenantId: Tenant
     * @param startDate: Ngày bắt đầu
     * @param endDate: Ngày kết thúc
     * @return List of WasteReportDto với waste% benchmarking
     */
    List<WasteReportDto> findWasteReport(
            UUID branchId,
            UUID tenantId,
            LocalDate startDate,
            LocalDate endDate);
    
    /**
     * Lấy báo cáo COGS (Cost of Goods Sold)
     * 
     * IMPORTANT: Use FIFO order (ORDER BY imported_at ASC)
     * 
     * @param branchId: Chi nhánh
     * @param tenantId: Tenant
     * @param startDate: Ngày bắt đầu
     * @param endDate: Ngày kết thúc
     * @param pageable: Pagination (100 per page recommended)
     * @return Page of CogsDto sorted by date DESC
     */
    Page<CogsDto> findCogs(
            UUID branchId,
            UUID tenantId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable);
    
    /**
     * Low-level query thực thi raw SQL và return entity
     * Dùng cho complex queries hoặc performance optimization
     */
    <T> List<T> executeNativeQuery(String sql, Class<T> resultClass, Object... params);
}
