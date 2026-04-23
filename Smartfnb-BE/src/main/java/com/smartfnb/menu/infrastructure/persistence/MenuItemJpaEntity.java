package com.smartfnb.menu.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity cho bảng items.
 * Đại diện cho món ăn/đồ uống có thể bán (type = SELLABLE).
 * Hỗ trợ soft delete qua trường deleted_at.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Entity
@Table(name = "items")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class MenuItemJpaEntity {

    /** ID duy nhất của món ăn */
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    /** ID tenant sở hữu món ăn này */
    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    /** ID danh mục — có thể null nếu chưa phân loại */
    @Column(name = "category_id", columnDefinition = "uuid")
    private UUID categoryId;

    /** Tên món ăn — unique trong tenant */
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /**
     * Loại item: SELLABLE | INGREDIENT | SUB_ASSEMBLY.
     * Module Menu chỉ quản lý SELLABLE.
     */
    @Column(name = "type", nullable = false, length = 20)
    private String type = "SELLABLE";

    /** Giá bán mặc định (có thể bị ghi đè bởi branch_items) */
    @Column(name = "base_price", precision = 12, scale = 2)
    private BigDecimal basePrice = BigDecimal.ZERO;

    /** Đơn vị tính: ly, cái, kg... */
    @Column(name = "unit", length = 30)
    private String unit;

    /** URL ảnh của món ăn */
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    /** Đồng bộ lên app giao hàng hay không */
    @Column(name = "is_sync_delivery")
    private Boolean isSyncDelivery = false;

    /** Trạng thái kích hoạt */
    @Column(name = "is_active")
    private Boolean isActive = true;

    /**
     * Thời điểm soft delete — NULL nghĩa là chưa xóa.
     * Hibernate @Where tự động loại các bản ghi này khỏi query.
     */
    @Column(name = "deleted_at")
    private Instant deletedAt;

    /** Thời điểm tạo */
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    /**
     * Kiểm tra món ăn có bị soft delete chưa.
     *
     * @return true nếu đã xóa mềm
     */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * Thực hiện soft delete bằng cách set thời điểm xóa.
     */
    public void softDelete() {
        this.deletedAt = Instant.now();
        this.isActive = false;
    }
}
