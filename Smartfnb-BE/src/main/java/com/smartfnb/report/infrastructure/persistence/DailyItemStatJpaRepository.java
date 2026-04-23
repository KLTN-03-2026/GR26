package com.smartfnb.report.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho DailyItemStatJpaEntity.
 *
 * @author vutq
 * @since 2026-04-16
 */
@Repository
public interface DailyItemStatJpaRepository extends JpaRepository<DailyItemStatJpaEntity, UUID> {
    
    Optional<DailyItemStatJpaEntity> findByBranchIdAndItemIdAndDate(UUID branchId, UUID itemId, LocalDate date);
    
    List<DailyItemStatJpaEntity> findByBranchIdAndDateOrderByRevenueDesc(UUID branchId, LocalDate date);
}
