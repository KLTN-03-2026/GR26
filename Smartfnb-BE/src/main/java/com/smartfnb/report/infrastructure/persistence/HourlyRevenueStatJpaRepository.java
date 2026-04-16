package com.smartfnb.report.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho HourlyRevenueStatJpaEntity.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Repository
public interface HourlyRevenueStatJpaRepository extends JpaRepository<HourlyRevenueStatJpaEntity, UUID> {
    
    Optional<HourlyRevenueStatJpaEntity> findByBranchIdAndDateAndHour(UUID branchId, LocalDate date, int hour);
    
    List<HourlyRevenueStatJpaEntity> findByBranchIdAndDateOrderByHour(UUID branchId, LocalDate date);
}
