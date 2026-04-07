package com.smartfnb.supplier.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Ném khi không tìm thấy nhà cung cấp trong scope tenant.
 */
public class SupplierNotFoundException extends SmartFnbException {
    public SupplierNotFoundException(UUID id) {
        super("SUPPLIER_NOT_FOUND", "Không tìm thấy nhà cung cấp với ID: " + id);
    }
}
