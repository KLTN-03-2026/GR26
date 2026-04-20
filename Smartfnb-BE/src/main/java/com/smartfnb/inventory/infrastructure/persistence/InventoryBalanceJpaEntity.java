package com.smartfnb.inventory.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity đại diện cho bảng inventory_balances.
 * Lưu tồn kho hiện tại của một nguyên liệu tại một chi nhánh cụ thể.
 * Sử dụng Optimistic Locking qua @Version.
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
@Entity
@Table(
    name = "inventory_balances",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_inventory_branch_item",
        columnNames = {"branch_id", "item_id"}
    ),
    indexes = {
        @Index(name = "idx_inventory_branch", columnList = "branch_id"),
        @Index(name = "idx_inventory_tenant", columnList = "tenant_id")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InventoryBalanceJpaEntity {

    /** Khóa chính UUID */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Tenant sở hữu — bắt buộc trong mọi query */
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** Chi nhánh — bắt buộc */
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    /** Nguyên liệu tương ứng */
    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    /** Tên nguyên liệu — lấy từ items (để tránh N+1 join) */
    @Column(name = "item_name")
    private String itemName;

    /** Đơn vị tính (g, ml, cái...) */
    @Column(name = "unit")
    private String unit;

    /** Số lượng tồn kho hiện tại */
    @Column(name = "quantity", nullable = false, precision = 10, scale = 4)
    private BigDecimal quantity;

    /** Ngưỡng cảnh báo sắp hết kho (S-14) */
    @Column(name = "min_level", nullable = false, precision = 10, scale = 4)
    private BigDecimal minLevel;

    /** Optimistic locking — tránh concurrent update mất dữ liệu */
    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    /** Thời điểm cập nhật cuối */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Factory method tạo bản ghi tồn kho mới.
     *
     * @param tenantId UUID tenant
     * @param branchId UUID chi nhánh
     * @param itemId   UUID nguyên liệu
     * @param itemName tên nguyên liệu (snapshot)
     * @param unit     đơn vị tính
     * @param quantity số lượng ban đầu
     * @param minLevel ngưỡng cảnh báo
     * @return entity mới
     */
    public static InventoryBalanceJpaEntity create(UUID tenantId, UUID branchId,
                                                    UUID itemId, String itemName,
                                                    String unit, BigDecimal quantity,
                                                    BigDecimal minLevel) {
        InventoryBalanceJpaEntity entity = new InventoryBalanceJpaEntity();
        entity.tenantId = tenantId;
        entity.branchId = branchId;
        entity.itemId = itemId;
        entity.itemName = itemName;
        entity.unit = unit;
        entity.quantity = quantity;
        entity.minLevel = minLevel != null ? minLevel : BigDecimal.ZERO;
        entity.updatedAt = Instant.now();
        return entity;
    }

    /**
     * Tăng số lượng tồn kho (khi nhập hàng).
     *
     * @param amount số lượng tăng (phải dương)
     */
    public void increaseQuantity(BigDecimal amount) {
        this.quantity = this.quantity.add(amount);
        this.updatedAt = Instant.now();
    }

    /**
     * Giảm số lượng tồn kho.
     * Không kiểm tra tại đây — kiểm tra xảy ra tại domain service.
     *
     * @param amount số lượng giảm (phải dương)
     */
    public void decreaseQuantity(BigDecimal amount) {
        this.quantity = this.quantity.subtract(amount);
        this.updatedAt = Instant.now();
    }

    /**
     * Kiểm tra tồn kho có đang dưới ngưỡng cảnh báo không.
     *
     * @return true nếu quantity <= minLevel
     */
    public boolean isBelowMinLevel() {
        return this.quantity.compareTo(this.minLevel) <= 0;
    }
}
