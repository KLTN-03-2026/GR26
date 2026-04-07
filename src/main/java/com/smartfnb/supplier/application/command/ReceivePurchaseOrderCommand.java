package com.smartfnb.supplier.application.command;

import java.util.UUID;

/** Xác nhận nhận hàng — chuyển PO sang RECEIVED */
public record ReceivePurchaseOrderCommand(UUID purchaseOrderId, UUID tenantId, UUID userId) {}
