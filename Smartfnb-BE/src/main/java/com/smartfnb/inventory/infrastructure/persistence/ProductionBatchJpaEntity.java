package com.smartfnb.inventory.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity đại diện cho bảng production_batches.
 * Ghi nhận mỗi mẻ sản xuất bán thành phẩm (SUB_ASSEMBLY).
 * Là audit trail bán thành đổi — CONFIRMED ngay khi tạo, không có DRAFT.
 *
 * @author SmartF&B Team
 * @since 2026-04-14
 */
@Entity
@Table(
    name = "production_batches",
    indexes = {
        @Index(name = "idx_prod_batches_branch_item",
               columnList = "branch_id, sub_assembly_item_id, produced_at DESC"),
        @Index(name = "idx_prod_batches_tenant",
               columnList = "tenant_id, produced_at DESC")
    }
)
@Getter
@Setter
@NoArgsConstructor
public class ProductionBatchJpaEntity {

    /** Khóa chính UUID */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Tenant sở hữu */
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    /** Chi nhánh thực hiện sản xuất */
    @Column(name = "branch_id", nullable = false, updatable = false)
    private UUID branchId;

    /** ID bán thành phẩm đầu ra (type=SUB_ASSEMBLY trong bảng items) */
    @Column(name = "sub_assembly_item_id", nullable = false, updatable = false)
    private UUID subAssemblyItemId;

    /** Snapshot công thức tại thời điểm sản xuất — JSONB để audit khi công thức thay đổi */
    @Column(name = "recipe_snapshot", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String recipeSnapshot;

    /** Sản lượng chuẩn theo công thức */
    @Column(name = "expected_output", nullable = false, precision = 10, scale = 4)
    private BigDecimal expectedOutput;

    /** Sản lượng thực tế nhân viên báo cáo sau khi sản xuất */
    @Column(name = "actual_output", nullable = false, precision = 10, scale = 4)
    private BigDecimal actualOutput;

    /** Đơn vị tính của đầu ra */
    @Column(name = "unit", nullable = false, length = 30)
    private String unit;

    /** Nhân viên thực hiện */
    @Column(name = "produced_by", nullable = false, updatable = false)
    private UUID producedBy;

    /** Thời điểm sản xuất */
    @Column(name = "produced_at", nullable = false, updatable = false)
    private Instant producedAt;

    /** Ghi chú — lý do bất thường, số hiệu mẻ... */
    @Column(name = "note", length = 1000)
    private String note;

    /**
     * Trạng thái mẻ sản xuất.
     * Hiện tại chỉ có CONFIRMED — không dùng DRAFT để tránh phức tạp hóa.
     */
    @Column(name = "status", nullable = false, length = 20)
    private String status = "CONFIRMED";

    /** Thời điểm tạo record */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Tính chênh lệch giữa actual và expected.
     * Dương = sản xuất vượt định mức (tốt).
     * Âm = sản xuất dưới định mức (ít xảy ra).
     *
     * @return actual - expected
     */
    public BigDecimal getDelta() {
        if (actualOutput == null || expectedOutput == null) return BigDecimal.ZERO;
        return actualOutput.subtract(expectedOutput);
    }
}
