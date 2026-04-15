package com.smartfnb.inventory.infrastructure.persistence;

import com.smartfnb.inventory.domain.model.InventoryItem;
import com.smartfnb.inventory.domain.repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Triển khai cụ thể của InventoryItemRepository sử dụng hạ tầng Spring Data JPA.
 * Đóng vai trò là cầu nối (Adapter) giữa tầng Domain và tầng Infrastructure.
 * 
 * Nghiệp vụ:
 * - Chuyển đổi dữ liệu qua lại giữa Domain Model và JPA Entity (Mapping).
 * - Thực hiện các thao tác CRUD xuống cơ sở dữ liệu.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
public class InventoryItemRepositoryImpl implements InventoryItemRepository {

    private final InventoryItemJpaRepository jpaRepository;

    @Override
    public Optional<InventoryItem> findByIdAndTenantId(UUID id, UUID tenantId) {
        // Tìm kiếm thực thể JPA và chuyển đổi sang Domain Model nếu tìm thấy
        return jpaRepository.findByIdAndTenantId(id, tenantId)
                .map(InventoryItemJpaEntity::toDomain);
    }

    @Override
    public void save(InventoryItem item) {
        // Chuyển đổi từ Domain Model sang thực thể JPA trước khi lưu trữ
        InventoryItemJpaEntity entity = InventoryItemJpaEntity.fromDomain(item);
        jpaRepository.save(entity);
    }

    @Override
    public boolean existsByNameAndTenantId(String name, UUID tenantId) {
        // Kiểm tra sự tồn tại của tên nguyên liệu trong cùng tenant
        return jpaRepository.existsByNameAndTenantId(name, tenantId);
    }

    @Override
    public boolean existsBySkuAndTenantId(String sku, UUID tenantId) {
        // Kiểm tra tính duy nhất của mã SKU trong cùng tenant
        return jpaRepository.existsBySkuAndTenantId(sku, tenantId);
    }
}
