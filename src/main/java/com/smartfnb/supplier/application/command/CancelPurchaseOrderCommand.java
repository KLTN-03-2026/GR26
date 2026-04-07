package com.smartfnb.supplier.application.command;

import java.util.UUID;

/** Huỷ đơn mua hàng */
public record CancelPurchaseOrderCommand(UUID purchaseOrderId, UUID tenantId, UUID userId, String reason) {}
