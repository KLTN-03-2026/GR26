package com.smartfnb.menu.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

import static java.math.BigDecimal.ONE;

/**
 * JPA Entity cho bảng addons.
 * Đại diện cho topping/addon có thể thêm vào món ăn.
 * Unique: (tenant_id, name).
 *
 * @author vutq
 * @since 2026-03-28
 */
@Entity
@Table(name = "addons")
@Getter
@Setter
@NoArgsConstructor
public class AddonJpaEntity {

    /** ID duy nhất của addon */
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    /** ID tenant sở hữu addon */
    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    /** Tên topping/addon — unique trong tenant */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /** Giá cộng thêm khi khách chọn addon này */
    @Column(name = "extra_price", precision = 12, scale = 2)
    private BigDecimal extraPrice = BigDecimal.ZERO;

    /** Trạng thái kích hoạt — false khi ngừng cung cấp */
    @Column(name = "is_active")
    private Boolean isActive = true;

    /**
     * FK tới items(id) — INGREDIENT hoặc SUB_ASSEMBLY.
     * NULL = addon thuần giá, không trừ kho.
     */
    @Column(name = "item_id", columnDefinition = "uuid")
    private UUID itemId;

    /**
     * Định lượng tiêu hao cho mỗi 1 đơn vị addon bán ra.
     * Ví dụ: 30 (ml sữa), 50 (g kem).
     * Chỉ có nghĩa khi item_id != null.
     */
    @Column(name = "item_quantity", precision = 10, scale = 4)
    private BigDecimal itemQuantity = ONE;

    /**
     * Đơn vị tính của item_quantity (g, ml, cái...).
     * Tham khảo — không bắt buộc.
     */
    @Column(name = "item_unit", length = 30)
    private String itemUnit;
}
