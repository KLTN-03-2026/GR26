package com.smartfnb.inventory.infrastructure.persistence;

import com.smartfnb.inventory.domain.model.ProductionBatch;
import com.smartfnb.inventory.domain.repository.ProductionBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Triển khai ProductionBatchRepository dùng JPA.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
public class ProductionBatchRepositoryImpl implements ProductionBatchRepository {

    private final ProductionBatchJpaRepository jpaRepository;

    @Override
    public void save(ProductionBatch batch) {
        ProductionBatchJpaEntity entity = ProductionBatchJpaEntity.fromDomain(batch);
        jpaRepository.save(entity);
    }

    @Override
    public Optional<ProductionBatch> findById(UUID id) {
        return jpaRepository.findById(id)
                .map(ProductionBatchJpaEntity::toDomain);
    }
}
