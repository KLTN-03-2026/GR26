package com.smartfnb.inventory.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho thực thể InventoryItemJpaEntity.
 * Thực hiện các câu lệnh SQL tương tác trực tiếp với cơ sở dữ liệu bảng 'items'.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Repository
public interface InventoryItemJpaRepository extends JpaRepository<InventoryItemJpaEntity, UUID> {
    
    /**
     * Tìm thực thể theo ID và Tenant (đảm bảo isolation).
     */
    Optional<InventoryItemJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);
    
    /**
     * Truy vấn kiểm tra tên trùng lặp (Case-sensitive tùy thuộc cấu hình cột).
     */
    boolean existsByNameAndTenantId(String name, UUID tenantId);
    
    /**
     * Truy vấn kiểm tra SKU trùng lặp.
     */
    boolean existsBySkuAndTenantId(String sku, UUID tenantId);
}
