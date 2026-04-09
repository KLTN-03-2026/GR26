package com.smartfnb.order.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * JPA Entity cho bảng table_zones.
 * Đại diện cho khu vực/tầng trong chi nhánh (VD: Tầng 1, Sân thượng, VIP).
 * Unique constraint: (branch_id, name).
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Entity
@Table(name = "table_zones")
@Getter
@Setter
@NoArgsConstructor
public class TableZoneJpaEntity {

    /** ID duy nhất của khu vực bàn */
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    /**
     * ID chi nhánh sở hữu khu vực này.
     * Mỗi chi nhánh có nhiều zone độc lập nhau.
     */
    @Column(name = "branch_id", nullable = false, columnDefinition = "uuid")
    private UUID branchId;

    /** Tên khu vực — unique trong chi nhánh */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /** Số tầng (hỗ trợ quán nhiều tầng) */
    @Column(name = "floor_number")
    private Integer floorNumber = 1;
}
