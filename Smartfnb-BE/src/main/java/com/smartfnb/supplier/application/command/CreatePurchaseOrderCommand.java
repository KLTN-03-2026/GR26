package com.smartfnb.supplier.application.command;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Tạo đơn mua hàng mới (DRAFT) */
public record CreatePurchaseOrderCommand(
        UUID tenantId,
        UUID branchId,
        UUID supplierId,
        String note,
        LocalDate expectedDate,
        UUID createdBy,
        List<PurchaseOrderItemCommand> items
) {
    public record PurchaseOrderItemCommand(
            UUID itemId,
            String itemName,
            String unit,
            BigDecimal quantity,
            BigDecimal unitPrice,
            String note
    ) {}
}
