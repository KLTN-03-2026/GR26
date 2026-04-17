package com.smartfnb.payment.application.command;

import java.util.UUID;

public record ManualConfirmQRPaymentCommand(
    UUID paymentId,
    UUID tenantId,
    UUID cashierId
) {}
