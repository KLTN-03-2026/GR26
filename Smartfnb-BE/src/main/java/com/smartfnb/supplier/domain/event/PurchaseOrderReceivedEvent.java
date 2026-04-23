package com.smartfnb.supplier.domain.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Domain Event phát ra khi đơn mua hàng được xác nhận nhận hàng (RECEIVED).
 *
 * <p>Consumer: InventoryModule — tự động tạo StockBatch cho từng item trong PO.
 *
 * @author vutq
 * @since 2026-04-07
 */
public record PurchaseOrderReceivedEvent(
        UUID purchaseOrderId,
        UUID tenantId,
        UUID branchId,
        UUID supplierId,
        String orderNumber,
        UUID receivedByUserId,
        List<ReceivedItem> items,
        Instant occurredAt
) {
    /**
     * Từng item trong PO đã nhận — đủ dữ liệu để Inventory tạo StockBatch mà không cần query thêm.
     */
    public record ReceivedItem(
            UUID itemId,
            String itemName,
            String unit,
            BigDecimal quantity,
            BigDecimal unitPrice
    ) {}
}
