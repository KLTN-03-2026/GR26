package com.smartfnb.order.application.command;

import java.util.UUID;

public record UpdateOrderStatusCommand(
    UUID orderId,
    UUID tenantId,
    UUID branchId,
    UUID staffId,
    String newStatus,
    String reason
) {}
