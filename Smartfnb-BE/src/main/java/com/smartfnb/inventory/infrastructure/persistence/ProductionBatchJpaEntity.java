package com.smartfnb.inventory.infrastructure.persistence;

import com.smartfnb.inventory.domain.model.ProductionBatch;
import com.smartfnb.shared.domain.BaseAggregateRoot;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA Entity ánh xạ bảng production_batches.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Entity
@Table(name = "production_batches")
@Getter
@Setter
@NoArgsConstructor
public class ProductionBatchJpaEntity extends BaseAggregateRoot {

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(name = "sub_assembly_item_id", nullable = false)
    private UUID subAssemblyItemId;

    /** Snapshot công thức - lưu dưới dạng JSONB trong database */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recipe_snapshot", columnDefinition = "jsonb")
    private String recipeSnapshot;

    @Column(name = "expected_output", precision = 10, scale = 4, nullable = false)
    private BigDecimal expectedOutput;

    @Column(name = "actual_output", precision = 10, scale = 4, nullable = false)
    private BigDecimal actualOutput;

    @Column(name = "unit", length = 30, nullable = false)
    private String unit;

    @Column(name = "produced_by", nullable = false)
    private UUID producedBy;

    @Column(name = "produced_at", nullable = false)
    private LocalDateTime producedAt;

    @Column(name = "note", length = 1000)
    private String note;

    @Column(name = "status", length = 20, nullable = false)
    private String status;

    public ProductionBatchJpaEntity(UUID tenantId) {
        super(tenantId);
    }

    /**
     * Map từ Domain Model sang JPA Entity.
     */
    public static ProductionBatchJpaEntity fromDomain(ProductionBatch domain) {
        ProductionBatchJpaEntity entity = new ProductionBatchJpaEntity(domain.getTenantId());
        
        // Reflection để set ID vì BaseAggregateRoot không có setter
        try {
            java.lang.reflect.Field idField = com.smartfnb.shared.domain.BaseAggregateRoot.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(entity, domain.getId());
        } catch (Exception e) {
            // Log if needed
        }

        entity.setBranchId(domain.getBranchId());
        entity.setSubAssemblyItemId(domain.getSubAssemblyItemId());
        entity.setRecipeSnapshot(domain.getRecipeSnapshot());
        entity.setExpectedOutput(domain.getExpectedOutput());
        entity.setActualOutput(domain.getActualOutput());
        entity.setUnit(domain.getUnit());
        entity.setProducedBy(domain.getProducedBy());
        entity.setProducedAt(domain.getProducedAt());
        entity.setNote(domain.getNote());
        entity.setStatus(domain.getStatus());
        
        return entity;
    }

    /**
     * Map từ JPA Entity sang Domain Model.
     */
    public ProductionBatch toDomain() {
        return ProductionBatch.reconstruct(
                getId(),
                getTenantId(),
                branchId,
                subAssemblyItemId,
                recipeSnapshot,
                expectedOutput,
                actualOutput,
                unit,
                producedBy,
                producedAt,
                note,
                status,
                getCreatedAt() != null ? getCreatedAt() : LocalDateTime.now()
        );
    }

    public java.math.BigDecimal getDelta() {
        if (actualOutput == null || expectedOutput == null) {
            return java.math.BigDecimal.ZERO;
        }
        return actualOutput.subtract(expectedOutput);
    }
}
