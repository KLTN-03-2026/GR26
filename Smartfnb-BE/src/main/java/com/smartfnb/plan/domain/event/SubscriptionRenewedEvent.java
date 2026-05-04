package com.smartfnb.plan.domain.event;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Domain Event phát sinh khi subscription của Tenant được gia hạn thành công.
 * Publish qua Spring ApplicationEventPublisher sau khi admin xác nhận thanh toán.
 *
 * <p>Listener có thể phản ứng để: gửi email thông báo gia hạn,
 * cập nhật cache, hoặc ghi audit log.</p>
 *
 * @param tenantId      ID của tenant vừa gia hạn
 * @param planId        ID gói dịch vụ được gia hạn
 * @param newExpiresAt  Thời điểm hết hạn mới của subscription
 * @param invoiceNumber Mã hóa đơn xác nhận thanh toán
 *
 * @author vutq
 * @since 2026-04-24
 */
public record SubscriptionRenewedEvent(
        UUID tenantId,
        UUID planId,
        LocalDateTime newExpiresAt,
        String invoiceNumber
) {}
