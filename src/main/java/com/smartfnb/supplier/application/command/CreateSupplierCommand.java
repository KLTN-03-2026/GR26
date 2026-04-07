package com.smartfnb.supplier.application.command;

import java.util.UUID;

/** Tạo nhà cung cấp mới */
public record CreateSupplierCommand(
        UUID tenantId,
        String name,
        String code,
        String contactName,
        String phone,
        String email,
        String address,
        String taxCode,
        String note
) {}
