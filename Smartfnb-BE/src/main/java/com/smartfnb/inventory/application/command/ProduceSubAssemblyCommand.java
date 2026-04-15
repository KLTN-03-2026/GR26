package com.smartfnb.inventory.application.command;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Lệnh sản xuất bán thành phẩm.
 * 
 * @param tenantId      ID tenant (từ context)
 * @param branchId      ID chi nhánh nơi sản xuất
 * @param subAssemblyId ID bán thành phẩm cần sản xuất
 * @param expectedOutput Số lượng dự kiến theo công thức
 * @param actualOutput   Số lượng thực tế chế biến được
 * @param producedBy     ID nhân viên thực hiện (từ context)
 * @param note           Ghi chú
 */
public record ProduceSubAssemblyCommand(
    @NotNull UUID tenantId,
    @NotNull UUID branchId,
    @NotNull UUID subAssemblyId,
    @NotNull @DecimalMin("0.0001") BigDecimal expectedOutput,
    @NotNull @DecimalMin("0.0001") BigDecimal actualOutput,
    @NotNull UUID producedBy,
    String note
) {}
