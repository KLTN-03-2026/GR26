package com.smartfnb.report.infrastructure.persistence;

import com.smartfnb.report.domain.model.DailyItemStat;
import com.smartfnb.report.domain.repository.DailyItemStatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation của DailyItemStatRepository.
 *
 * @author vutq
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
public class DailyItemStatRepositoryImpl implements DailyItemStatRepository {
    
    private final DailyItemStatJpaRepository jpaRepository;
    
    @Override
    public DailyItemStat save(DailyItemStat stat) {
        DailyItemStatJpaEntity entity = DailyItemStatJpaEntity.fromDomain(stat);
        DailyItemStatJpaEntity saved = jpaRepository.save(entity);
        return saved.toDomain();
    }
    
    @Override
    public void upsert(DailyItemStat stat) {
        jpaRepository.upsertItemStat(
            stat.id(),
            stat.tenantId(),
            stat.branchId(),
            stat.itemId(),
            stat.itemName(),
            stat.date(),
            stat.qtySold(),
            stat.revenue() != null ? stat.revenue() : java.math.BigDecimal.ZERO,
            stat.cost() != null ? stat.cost() : java.math.BigDecimal.ZERO
        );
    }
    
    @Override
    public Optional<DailyItemStat> findByBranchIdItemIdAndDate(UUID branchId, UUID itemId, LocalDate date) {
        return jpaRepository.findByBranchIdAndItemIdAndDate(branchId, itemId, date)
            .map(DailyItemStatJpaEntity::toDomain);
    }
    
    @Override
    public List<DailyItemStat> findByBranchIdAndDate(UUID branchId, LocalDate date) {
        return jpaRepository.findByBranchIdAndDateOrderByRevenueDesc(branchId, date)
            .stream()
            .map(DailyItemStatJpaEntity::toDomain)
            .toList();
    }
    
    @Override
    public void delete(DailyItemStat stat) {
        DailyItemStatJpaEntity entity = DailyItemStatJpaEntity.fromDomain(stat);
        jpaRepository.delete(entity);
    }
}
