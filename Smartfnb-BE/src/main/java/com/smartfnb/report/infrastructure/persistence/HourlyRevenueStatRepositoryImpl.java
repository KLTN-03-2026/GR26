package com.smartfnb.report.infrastructure.persistence;

import com.smartfnb.report.domain.model.HourlyRevenueStat;
import com.smartfnb.report.domain.repository.HourlyRevenueStatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation của HourlyRevenueStatRepository.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
public class HourlyRevenueStatRepositoryImpl implements HourlyRevenueStatRepository {
    
    private final HourlyRevenueStatJpaRepository jpaRepository;
    
    @Override
    public HourlyRevenueStat save(HourlyRevenueStat stat) {
        HourlyRevenueStatJpaEntity entity = HourlyRevenueStatJpaEntity.fromDomain(stat);
        HourlyRevenueStatJpaEntity saved = jpaRepository.save(entity);
        return saved.toDomain();
    }
    
    @Override
    public Optional<HourlyRevenueStat> findByBranchIdDateAndHour(UUID branchId, LocalDate date, int hour) {
        return jpaRepository.findByBranchIdAndDateAndHour(branchId, date, hour)
            .map(HourlyRevenueStatJpaEntity::toDomain);
    }
    
    @Override
    public List<HourlyRevenueStat> findByBranchIdAndDate(UUID branchId, LocalDate date) {
        return jpaRepository.findByBranchIdAndDateOrderByHour(branchId, date)
            .stream()
            .map(HourlyRevenueStatJpaEntity::toDomain)
            .toList();
    }
    
    @Override
    public void delete(HourlyRevenueStat stat) {
        HourlyRevenueStatJpaEntity entity = HourlyRevenueStatJpaEntity.fromDomain(stat);
        jpaRepository.delete(entity);
    }
}
