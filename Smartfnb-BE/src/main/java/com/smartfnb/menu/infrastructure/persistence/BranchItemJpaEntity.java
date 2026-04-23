package com.smartfnb.menu.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * JPA Entity cho bảng branch_items.
 * Lưu giá bán riêng và trạng thái của món ăn tại từng chi nhánh.
 * branch_price = NULL nghĩa là dùng base_price từ bảng items.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Entity
@Table(name = "branch_items")
@Getter
@Setter
@NoArgsConstructor
public class BranchItemJpaEntity {

    /**
     * Khóa chính composite (branch_id, item_id).
     */
    @EmbeddedId
    private BranchItemId id;

    /**
     * Giá bán tại chi nhánh này.
     * NULL = áp dụng base_price của item.
     */
    @Column(name = "branch_price", precision = 12, scale = 2)
    private BigDecimal branchPrice;

    /** Món ăn có đang phục vụ tại chi nhánh này không */
    @Column(name = "is_available")
    private Boolean isAvailable = true;

    /**
     * Embeddable composite key cho branch_items.
     */
    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class BranchItemId implements java.io.Serializable {

        /** ID chi nhánh */
        @Column(name = "branch_id", columnDefinition = "uuid")
        private UUID branchId;

        /** ID món ăn */
        @Column(name = "item_id", columnDefinition = "uuid")
        private UUID itemId;

        public BranchItemId(UUID branchId, UUID itemId) {
            this.branchId = branchId;
            this.itemId = itemId;
        }
    }
}
