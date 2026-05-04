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
 * JPA Entity đại diện cho bảng stock_batches.
 * Mỗi batch là một lần nhập hàng — dùng cho thuật toán FIFO.
 *
 * <p>FIFO: khi xuất kho, lấy batch có imported_at nhỏ nhất còn quantity_remaining > 0.</p>
 *
 * @author vutq
 * @since 2026-04-03
 */
@Entity
@Table(
    name = "stock_batches",
    indexes = {
        @Index(name = "idx_batches_branch", columnList = "branch_id"),
        @Index(name = "idx_batches_tenant", columnList = "tenant_id")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StockBatchJpaEntity {

    /** Khóa chính UUID */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Tenant sở hữu */
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** Chi nhánh nhập kho */
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    /** Nguyên liệu */
    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    /** Nhà cung cấp (tùy chọn) */
    @Column(name = "supplier_id")
    private UUID supplierId;

    /** Số lượng ban đầu khi nhập */
    @Column(name = "quantity_initial", nullable = false, precision = 10, scale = 4)
    private BigDecimal quantityInitial;

    /** Số lượng còn lại (giảm dần theo FIFO) */
    @Column(name = "quantity_remaining", nullable = false, precision = 10, scale = 4)
    private BigDecimal quantityRemaining;

    /** Đơn giá nhập (dùng tính COGS) */
    @Column(name = "cost_per_unit", nullable = false, precision = 12, scale = 4)
    private BigDecimal costPerUnit;

    /** Thời điểm nhập — KEY cho FIFO sorting */
    @Column(name = "imported_at", nullable = false)
    private Instant importedAt;

    /** Hạn sử dụng (dùng cảnh báo trong báo cáo) */
    @Column(name = "expires_at")
    private Instant expiresAt;

    /** Thời điểm tạo bản ghi */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Factory method tạo batch nhập kho mới.
     *
     * @param tenantId         UUID tenant
     * @param branchId         UUID chi nhánh
     * @param itemId           UUID nguyên liệu
     * @param supplierId       UUID nhà cung cấp (nullable)
     * @param quantity         số lượng nhập
     * @param costPerUnit      đơn giá nhập
     * @param expiresAt        hạn sử dụng (nullable)
     * @return entity mới
     */
    public static StockBatchJpaEntity create(UUID tenantId, UUID branchId,
                                              UUID itemId, UUID supplierId,
                                              BigDecimal quantity, BigDecimal costPerUnit,
                                              Instant expiresAt) {
        StockBatchJpaEntity entity = new StockBatchJpaEntity();
        entity.tenantId = tenantId;
        entity.branchId = branchId;
        entity.itemId = itemId;
        entity.supplierId = supplierId;
        entity.quantityInitial = quantity;
        entity.quantityRemaining = quantity;
        entity.costPerUnit = costPerUnit;
        entity.importedAt = Instant.now();
        entity.expiresAt = expiresAt;
        entity.createdAt = Instant.now();
        return entity;
    }

    /**
     * Trừ số lượng khỏi batch (FIFO deduction).
     * Không được trừ nhiều hơn quantity_remaining.
     *
     * @param amount số lượng cần trừ (phải dương)
     */
    public void consume(BigDecimal amount) {
        this.quantityRemaining = this.quantityRemaining.subtract(amount);
    }

    /**
     * Kiểm tra batch còn hàng không.
     *
     * @return true nếu quantity_remaining > 0
     */
    public boolean hasRemaining() {
        return this.quantityRemaining.compareTo(BigDecimal.ZERO) > 0;
    }
}
