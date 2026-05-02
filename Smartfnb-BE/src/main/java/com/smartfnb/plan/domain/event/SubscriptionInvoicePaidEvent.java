package com.smartfnb.plan.domain.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Domain Event phát ra khi hóa đơn gói dịch vụ của Tenant được thanh toán thành công.
 *
 * <p>Consumer tiềm năng:
 * <ul>
 *   <li>Notification Module — gửi email/push thông báo gia hạn thành công</li>
 *   <li>Audit Module — ghi log tài chính</li>
 * </ul>
 * </p>
 *
 * @param invoiceId      UUID của hóa đơn vừa được thanh toán
 * @param tenantId       UUID của tenant
 * @param subscriptionId UUID của subscription được gia hạn
 * @param invoiceNumber  Mã hóa đơn (INV-YYYYMM-NNNNN)
 * @param amount         Số tiền đã thanh toán
 * @param paymentMethod  Phương thức thanh toán: VIETQR | MOMO
 * @param transactionId  Mã giao dịch từ payment gateway
 * @param occurredAt     Thời điểm thanh toán được xác nhận
 *
 * @author vutq
 * @since 2026-04-30
 */
public record SubscriptionInvoicePaidEvent(
        UUID invoiceId,
        UUID tenantId,
        UUID subscriptionId,
        String invoiceNumber,
        BigDecimal amount,
        String paymentMethod,
        String transactionId,
        Instant occurredAt
) {}
