package com.smartfnb.inventory.application.query.result;

import com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaEntity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Kết quả trả về cho một dòng tồn kho nguyên liệu.
 *
 * @param id             UUID của bản ghi inventory_balance
 * @param branchId       UUID chi nhánh
 * @param itemId         UUID nguyên liệu
 * @param itemName       tên nguyên liệu
 * @param unit           đơn vị tính
 * @param quantity       tồn kho hiện tại
 * @param minLevel       ngưỡng cảnh báo
 * @param isLowStock     true nếu đang dưới ngưỡng cảnh báo
 * @param updatedAt      thời điểm cập nhật cuối
 *
 * @author vutq
 * @since 2026-04-03
 */
public record InventoryBalanceResult(
    UUID id,
    UUID branchId,
    UUID itemId,
    String itemName,
    String unit,
    BigDecimal quantity,
    BigDecimal minLevel,
    boolean isLowStock,
    Instant updatedAt
) {
    /**
     * Mapping từ JPA Entity sang Result.
     *
     * @param entity entity tồn kho từ DB
     * @return InventoryBalanceResult
     */
    public static InventoryBalanceResult from(InventoryBalanceJpaEntity entity) {
        return new InventoryBalanceResult(
            entity.getId(),
            entity.getBranchId(),
            entity.getItemId(),
            entity.getItemName(),
            entity.getUnit(),
            entity.getQuantity(),
            entity.getMinLevel(),
            entity.isBelowMinLevel(),
            entity.getUpdatedAt()
        );
    }
}
