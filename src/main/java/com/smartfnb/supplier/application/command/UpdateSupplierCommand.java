package com.smartfnb.supplier.application.command;

import java.util.UUID;

/** Cập nhật thông tin nhà cung cấp */
public record UpdateSupplierCommand(
        UUID supplierId,
        UUID tenantId,
        String name,
        String code,
        String contactName,
        String phone,
        String email,
        String address,
        String taxCode,
        String note,
        boolean active
) {}
