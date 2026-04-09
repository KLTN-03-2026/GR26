package com.smartfnb.menu.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * JPA Entity cho bảng recipes.
 * Định nghĩa công thức chế biến: 1 món bán = N nguyên liệu với định lượng cụ thể.
 * Unique: (target_item_id, ingredient_item_id).
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Entity
@Table(name = "recipes")
@Getter
@Setter
@NoArgsConstructor
public class RecipeJpaEntity {

    /** ID duy nhất của dòng công thức */
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    /** ID tenant sở hữu công thức */
    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    /**
     * ID món ăn đích (item type = SELLABLE).
     * Đây là món sẽ dùng nguyên liệu này khi pha chế.
     */
    @Column(name = "target_item_id", nullable = false, columnDefinition = "uuid")
    private UUID targetItemId;

    /**
     * ID nguyên liệu cần dùng (item type = INGREDIENT hoặc SUB_ASSEMBLY).
     */
    @Column(name = "ingredient_item_id", nullable = false, columnDefinition = "uuid")
    private UUID ingredientItemId;

    /**
     * Định lượng nguyên liệu cần dùng cho 1 đơn vị món.
     * Phải > 0.
     */
    @Column(name = "quantity", precision = 10, scale = 4, nullable = false)
    private BigDecimal quantity;

    /** Đơn vị tính của nguyên liệu trong công thức (g, ml, cái...) */
    @Column(name = "unit", length = 30)
    private String unit;
}
