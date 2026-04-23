package com.smartfnb.report.domain.repository;

import com.smartfnb.report.domain.model.DailyRevenueSummary;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface cho DailyRevenueSummary.
 * Không import JPA — thuần Java interface.
 *
 * @author vutq
 * @since 2026-04-16
 */
public interface DailyRevenueSummaryRepository {
    
    /**
     * Lưu hoặc cập nhật bản ghi doanh thu hàng ngày.
     */
    DailyRevenueSummary save(DailyRevenueSummary summary);
    
    /**
     * Tìm bản ghi theo chi nhánh và ngày.
     */
    Optional<DailyRevenueSummary> findByBranchIdAndDate(UUID branchId, LocalDate date);
    
    /**
     * Xóa (nếu cần reset).
     */
    void delete(DailyRevenueSummary summary);
}
