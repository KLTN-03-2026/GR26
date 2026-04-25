package com.smartfnb.report.domain.repository;

import com.smartfnb.report.domain.model.HourlyRevenueStat;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface cho HourlyRevenueStat.
 *
 * @author vutq
 * @since 2026-04-16
 */
public interface HourlyRevenueStatRepository {
    
    HourlyRevenueStat save(HourlyRevenueStat stat);
    
    Optional<HourlyRevenueStat> findByBranchIdDateAndHour(UUID branchId, LocalDate date, int hour);
    
    /**
     * Lấy toàn bộ thống kê giờ trong một ngày để render heatmap.
     */
    List<HourlyRevenueStat> findByBranchIdAndDate(UUID branchId, LocalDate date);
    
    void delete(HourlyRevenueStat stat);
}
