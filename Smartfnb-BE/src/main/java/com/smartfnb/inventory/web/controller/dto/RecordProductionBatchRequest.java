package com.smartfnb.inventory.web.controller.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO request ghi nhận một mẻ sản xuất bán thành phẩm.
 * producedBy và tenantId/branchId lấy từ JWT — không nhận từ client.
 *
 * @param subAssemblyItemId    ID bán thành phẩm đầu ra (type=SUB_ASSEMBLY)
 * @param expectedOutputQuantity Sản lượng chuẩn theo công thức
 * @param actualOutputQuantity   Sản lượng thực tế nhân viên nhập sau khi sản xuất
 * @param unit                 Đơn vị tính đầu ra (phải khớp với unit trong tồn kho)
 * @param note                 Ghi chú mẻ sản xuất (tùy chọn)
 *
 * @author SmartF&B Team
 * @since 2026-04-14
 */
public record RecordProductionBatchRequest(

        @NotNull(message = "Bán thành phẩm đầu ra không được để trống")
        UUID subAssemblyItemId,

        @NotNull(message = "Sản lượng chuẩn không được để trống")
        @DecimalMin(value = "0", inclusive = false, message = "Sản lượng chuẩn phải > 0")
        BigDecimal expectedOutputQuantity,

        @NotNull(message = "Sản lượng thực tế không được để trống")
        @DecimalMin(value = "0", message = "Sản lượng thực tế không được âm")
        BigDecimal actualOutputQuantity,

        @NotBlank(message = "Đơn vị tính không được để trống")
        @Size(max = 30, message = "Đơn vị tính tối đa 30 ký tự")
        String unit,

        @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
        String note
) {}
