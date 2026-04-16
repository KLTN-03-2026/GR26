package com.smartfnb.report.infrastructure.persistence;

import com.smartfnb.report.domain.model.DailyRevenueSummary;
import com.smartfnb.report.domain.repository.DailyRevenueSummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation của DailyRevenueSummaryRepository.
 * Chuyển đổi giữa JPA Entity và Domain Model.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
public class DailyRevenueSummaryRepositoryImpl implements DailyRevenueSummaryRepository {
    
    private final DailyRevenueSummaryJpaRepository jpaRepository;
    
    @Override
    public DailyRevenueSummary save(DailyRevenueSummary summary) {
        DailyRevenueSummaryJpaEntity entity = DailyRevenueSummaryJpaEntity.fromDomain(summary);
        DailyRevenueSummaryJpaEntity saved = jpaRepository.save(entity);
        return saved.toDomain();
    }
    
    @Override
    public Optional<DailyRevenueSummary> findByBranchIdAndDate(UUID branchId, LocalDate date) {
        return jpaRepository.findByBranchIdAndDate(branchId, date)
            .map(DailyRevenueSummaryJpaEntity::toDomain);
    }
    
    @Override
    public void delete(DailyRevenueSummary summary) {
        DailyRevenueSummaryJpaEntity entity = DailyRevenueSummaryJpaEntity.fromDomain(summary);
        jpaRepository.delete(entity);
    }
}
