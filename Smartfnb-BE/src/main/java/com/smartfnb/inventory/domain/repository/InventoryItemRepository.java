package com.smartfnb.inventory.domain.repository;

import com.smartfnb.inventory.domain.model.InventoryItem;

import java.util.Optional;
import java.util.UUID;

/**
 * Interface cho việc lưu trữ và truy vấn InventoryItem.
 * Tuân thủ nguyên lý Repository Pattern trong DDD.
 * 
 * Nghiệp vụ:
 * - Cô lập tầng Domain khỏi chi tiết hạ tầng persistence.
 * - Định nghĩa các thao tác CRUD và kiểm tra tính duy nhất của dữ liệu.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public interface InventoryItemRepository {
    
    /**
     * Tìm kiếm một nguyên liệu theo ID và Tenant.
     */
    Optional<InventoryItem> findByIdAndTenantId(UUID id, UUID tenantId);
    
    /**
     * Lưu trữ (tạo mới hoặc cập nhật) một Aggregate Root InventoryItem.
     */
    void save(InventoryItem item);
    
    /**
     * Kiểm tra sự tồn tại của tên nguyên liệu trong một Tenant.
     */
    boolean existsByNameAndTenantId(String name, UUID tenantId);
    
    /**
     * Kiểm tra sự tồn tại của mã SKU trong một Tenant.
     */
    boolean existsBySkuAndTenantId(String sku, UUID tenantId);
}
