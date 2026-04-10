package com.smartfnb.supplier.application.command;

import java.util.UUID;

/** Chuyển PO từ DRAFT → SENT */
public record SendPurchaseOrderCommand(UUID purchaseOrderId, UUID tenantId, UUID userId) {}
