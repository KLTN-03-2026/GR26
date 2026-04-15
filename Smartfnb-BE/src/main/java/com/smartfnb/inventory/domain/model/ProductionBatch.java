package com.smartfnb.inventory.domain.model;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Aggregate Root đại diện cho một mẻ sản xuất bán thành phẩm.
 * Lưu trữ thông tin về sản lượng và công thức tại thời điểm sản xuất.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductionBatch {
    private UUID id;
    private UUID tenantId;
    private UUID branchId;
    private UUID subAssemblyItemId;
    
    /** Snapshot công thức dưới dạng JSON để phục vụ đối soát */
    private String recipeSnapshot;
    
    private BigDecimal expectedOutput;
    private BigDecimal actualOutput;
    private String unit;
    
    private UUID producedBy;
    private LocalDateTime producedAt;
    private String note;
    private String status;
    
    private LocalDateTime createdAt;

    @Builder
    private ProductionBatch(UUID tenantId, UUID branchId, UUID subAssemblyItemId,
                            String recipeSnapshot, BigDecimal expectedOutput,
                            BigDecimal actualOutput, String unit, UUID producedBy,
                            String note) {
        this.id = UUID.randomUUID();
        this.tenantId = tenantId;
        this.branchId = branchId;
        this.subAssemblyItemId = subAssemblyItemId;
        this.recipeSnapshot = recipeSnapshot;
        this.expectedOutput = expectedOutput;
        this.actualOutput = actualOutput;
        this.unit = unit;
        this.producedBy = producedBy;
        this.producedAt = LocalDateTime.now();
        this.note = note;
        this.status = "CONFIRMED"; // Mặc định là hoàn tất ngay
        this.createdAt = LocalDateTime.now();
    }

    /**
     * Khôi phục đối tượng từ dữ liệu đã lưu.
     */
    public static ProductionBatch reconstruct(
            UUID id, UUID tenantId, UUID branchId, UUID subAssemblyItemId,
            String recipeSnapshot, BigDecimal expectedOutput,
            BigDecimal actualOutput, String unit, UUID producedBy,
            LocalDateTime producedAt, String note, String status,
            LocalDateTime createdAt) {
        
        ProductionBatch batch = new ProductionBatch();
        batch.id = id;
        batch.tenantId = tenantId;
        batch.branchId = branchId;
        batch.subAssemblyItemId = subAssemblyItemId;
        batch.recipeSnapshot = recipeSnapshot;
        batch.expectedOutput = expectedOutput;
        batch.actualOutput = actualOutput;
        batch.unit = unit;
        batch.producedBy = producedBy;
        batch.producedAt = producedAt;
        batch.note = note;
        batch.status = status;
        batch.createdAt = createdAt;
        return batch;
    }
}
