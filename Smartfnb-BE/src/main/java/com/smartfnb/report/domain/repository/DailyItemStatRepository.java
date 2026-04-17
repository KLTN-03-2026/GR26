package com.smartfnb.report.domain.repository;

import com.smartfnb.report.domain.model.DailyItemStat;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface cho DailyItemStat.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public interface DailyItemStatRepository {
    
    DailyItemStat save(DailyItemStat stat);
    
    Optional<DailyItemStat> findByBranchIdItemIdAndDate(UUID branchId, UUID itemId, LocalDate date);
    
    List<DailyItemStat> findByBranchIdAndDate(UUID branchId, LocalDate date);
    
    void delete(DailyItemStat stat);
}
