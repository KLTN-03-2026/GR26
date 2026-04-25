package com.smartfnb.report.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho DailyRevenueSummaryJpaEntity.
 *
 * @author vutq
 * @since 2026-04-16
 */
@Repository
public interface DailyRevenueSummaryJpaRepository extends JpaRepository<DailyRevenueSummaryJpaEntity, UUID> {
    
    Optional<DailyRevenueSummaryJpaEntity> findByBranchIdAndDate(UUID branchId, LocalDate date);
}
