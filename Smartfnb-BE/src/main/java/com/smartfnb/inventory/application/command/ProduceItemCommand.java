package com.smartfnb.inventory.application.command;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Lệnh sản xuất mặt hàng.
 * 
 * @param tenantId      ID tenant (từ context)
 * @param branchId      ID chi nhánh thực hiện
 * @param outputItemId  ID mặt hàng đầu ra
 * @param quantity      Số lượng sản xuất thực tế
 * @param producedBy    ID nhân viên thực hiện (từ context)
 * @param ingredients   Danh sách nguyên liệu tiêu thụ
 * @param note          Ghi chú
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
public record ProduceItemCommand(
    @NotNull UUID tenantId,
    @NotNull UUID branchId,
    @NotNull UUID outputItemId,
    @NotNull @DecimalMin("0.0001") BigDecimal quantity,
    @NotNull UUID producedBy,
    @NotEmpty List<IngredientItem> ingredients,
    String note
) {
    /**
     * Thông tin chi tiết nguyên liệu tiêu thụ trong lệnh.
     */
    public record IngredientItem(
        @NotNull UUID itemId,
        @NotNull @DecimalMin("0.0001") BigDecimal quantity
    ) {}
}
