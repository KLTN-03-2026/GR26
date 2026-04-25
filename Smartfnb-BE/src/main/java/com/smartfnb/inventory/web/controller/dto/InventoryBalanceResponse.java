package com.smartfnb.inventory.web.controller.dto;

import com.smartfnb.inventory.application.query.result.InventoryBalanceResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO cho API xem tồn kho.
 * Không expose version (internal), không expose tenantId nội bộ.
 *
 * @param id         UUID bản ghi
 * @param branchId   UUID chi nhánh
 * @param itemId     UUID nguyên liệu
 * @param itemName   tên nguyên liệu
 * @param unit       đơn vị tính
 * @param quantity   tồn kho hiện tại
 * @param minLevel   ngưỡng cảnh báo
 * @param isLowStock true nếu đang dưới ngưỡng cảnh báo
 * @param updatedAt  thời điểm cập nhật cuối
 *
 * @author vutq
 * @since 2026-04-03
 */
public record InventoryBalanceResponse(
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
     * Mapping từ InventoryBalanceResult sang Response DTO.
     *
     * @param result kết quả từ query handler
     * @return response DTO
     */
    public static InventoryBalanceResponse from(InventoryBalanceResult result) {
        return new InventoryBalanceResponse(
            result.id(),
            result.branchId(),
            result.itemId(),
            result.itemName(),
            result.unit(),
            result.quantity(),
            result.minLevel(),
            result.isLowStock(),
            result.updatedAt()
        );
    }
}
