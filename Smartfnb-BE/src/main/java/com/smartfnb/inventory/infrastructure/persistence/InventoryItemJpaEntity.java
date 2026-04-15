package com.smartfnb.inventory.infrastructure.persistence;

import com.smartfnb.inventory.domain.model.InventoryItem;
import com.smartfnb.inventory.domain.model.ItemType;
import com.smartfnb.shared.domain.BaseAggregateRoot;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.util.UUID;

/**
 * JPA Entity ánh xạ vào bảng 'items' trong cơ sở dữ liệu.
 * Bảng 'items' dùng chung cho module Menu (SELLABLE) và module Inventory (INGREDIENT/SUB_ASSEMBLY).
 * 
 * Lưu ý:
 * - Sử dụng @Where để giới hạn phạm vi truy vấn chỉ trong module Inventory.
 * - Kế thừa BaseAggregateRoot để có các thông tin audit và multi-tenancy mặc định.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Entity
@Table(name = "items")
@Where(clause = "type IN ('INGREDIENT', 'SUB_ASSEMBLY')")
@Getter
@Setter
@NoArgsConstructor
public class InventoryItemJpaEntity extends BaseAggregateRoot {

    /** Tên gọi nguyên liệu */
    @Column(name = "name", nullable = false)
    private String name;

    /** Mã định danh SKU duy nhất trong hệ thống kho */
    @Column(name = "sku")
    private String sku;

    /** Phân loại: NGUYÊN LIỆU hoặc BÁN THÀNH PHẨM */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private ItemType type;

    /** Đơn vị tính cơ bản (ví dụ: kg, lít) */
    @Column(name = "unit")
    private String unit;

    /** ID danh mục cấp cha */
    @Column(name = "category_id")
    private UUID categoryId;

    /** Trạng thái kích hoạt trong kho */
    @Column(name = "is_active")
    private boolean isActive = true;

    /** Phiên bản dữ liệu phục vụ Optimistic Locking */
    @Version
    private Long version;

    public InventoryItemJpaEntity(UUID tenantId) {
        super(tenantId);
    }

    /**
     * Chuyển đổi từ Domain Model sang Persistence Entity để chuẩn bị lưu trữ.
     */
    public static InventoryItemJpaEntity fromDomain(InventoryItem item) {
        InventoryItemJpaEntity entity = new InventoryItemJpaEntity(item.getTenantId());
        
        // Cần dùng Reflection để gán ID vì BaseAggregateRoot thiết kế Immutable cho khóa chính
        try {
            java.lang.reflect.Field idField = com.smartfnb.shared.domain.BaseAggregateRoot.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(entity, item.getId());
        } catch (Exception e) {
            // Có thể log lỗi reflection tại đây nếu cần
        }

        entity.setName(item.getName());
        entity.setSku(item.getSku());
        entity.setType(item.getType());
        entity.setUnit(item.getUnit());
        entity.setCategoryId(item.getCategoryId());
        entity.setActive(item.isActive());
        entity.setVersion(item.getVersion());
        return entity;
    }

    /**
     * Chuyển đổi từ Persistence Entity sang Domain Model để thực hiện các xử lý nghiệp vụ.
     */
    public InventoryItem toDomain() {
        return InventoryItem.reconstruct(
                getId(),
                getTenantId(),
                name,
                sku,
                type,
                unit,
                categoryId,
                isActive,
                getCreatedAt(),
                getUpdatedAt(),
                version
        );
    }
}
