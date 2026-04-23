package com.smartfnb.inventory.application.command;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Command ghi nhận một mẻ sản xuất bán thành phẩm.
 * Khi command được xử lý:
 *   - Nguyên liệu đầu vào bị trừ theo công thức
 *   - Tồn kho bán thành phẩm tăng theo actualOutputQuantity
 *   - Giao dịch kho được ghi đầy đủ
 *
 * @param tenantId             ID tenant (từ JWT)
 * @param branchId             ID chi nhánh (từ JWT)
 * @param producedBy           ID nhân viên thực hiện (từ JWT)
 * @param subAssemblyItemId    ID bán thành phẩm đầu ra
 * @param expectedOutputQuantity Sản lượng chuẩn theo công thức
 * @param actualOutputQuantity   Sản lượng thực tế nhân viên báo cáo
 * @param unit                 Đơn vị tính của đầu ra
 * @param note                 Ghi chú mẻ sản xuất (tùy chọn)
 *
 * @author vutq
 * @since 2026-04-14
 */
public record RecordProductionBatchCommand(
        UUID tenantId,
        UUID branchId,
        UUID producedBy,

        @NotNull(message = "Bán thành phẩm đầu ra không được để trống")
        UUID subAssemblyItemId,

        @NotNull(message = "Sản lượng chuẩn không được để trống")
        @DecimalMin(value = "0", inclusive = false, message = "Sản lượng chuẩn phải > 0")
        BigDecimal expectedOutputQuantity,

        @NotNull(message = "Sản lượng thực tế không được để trống")
        @DecimalMin(value = "0", message = "Sản lượng thực tế không được âm")
        BigDecimal actualOutputQuantity,

        @NotBlank(message = "Đơn vị tính không được để trống")
        @Size(max = 30)
        String unit,

        @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
        String note
) {}
