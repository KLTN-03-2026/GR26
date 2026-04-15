package com.smartfnb.inventory.domain.repository;

import com.smartfnb.inventory.domain.model.ProductionBatch;

import java.util.Optional;
import java.util.UUID;

/**
 * Interface cho việc lưu trữ mẻ sản xuất.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public interface ProductionBatchRepository {
    
    /**
     * Lưu trữ mẻ sản xuất mới.
     */
    void save(ProductionBatch batch);
    
    /**
     * Tìm mẻ sản xuất theo ID.
     */
    Optional<ProductionBatch> findById(UUID id);
}
