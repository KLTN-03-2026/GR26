package com.smartfnb.supplier.application.command;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Cập nhật đơn mua hàng (chỉ khi ở trạng thái DRAFT) */
public record UpdatePurchaseOrderCommand(
        UUID purchaseOrderId,
        UUID tenantId,
        UUID supplierId,
        String note,
        LocalDate expectedDate,
        List<PurchaseOrderItemCmd> items
) {
    public record PurchaseOrderItemCmd(
            UUID itemId,
            String itemName,
            String unit,
            BigDecimal quantity,
            BigDecimal unitPrice,
            String note
    ) {}
}
