package com.smartfnb.order.application.command;

import java.util.UUID;

public record CancelOrderCommand(
    UUID orderId,
    UUID tenantId,
    UUID branchId,
    UUID staffId,
    String reason
) {}
