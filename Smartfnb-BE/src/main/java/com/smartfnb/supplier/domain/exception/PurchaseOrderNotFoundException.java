package com.smartfnb.supplier.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Ném khi không tìm thấy đơn mua hàng trong scope tenant.
 */
public class PurchaseOrderNotFoundException extends SmartFnbException {
    public PurchaseOrderNotFoundException(UUID id) {
        super("PURCHASE_ORDER_NOT_FOUND", "Không tìm thấy đơn mua hàng với ID: " + id);
    }
}
