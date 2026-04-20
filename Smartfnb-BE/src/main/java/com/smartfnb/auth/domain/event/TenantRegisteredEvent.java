package com.smartfnb.auth.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain Event: Phát ra khi chủ quán đăng ký tenant mới thành công.
 *
 * <p>Consumer:</p>
 * <ul>
 *   <li>{@code SubscriptionModule} — tạo Subscription mặc định cho tenant mới</li>
 *   <li>Audit log — ghi nhận sự kiện đăng ký mới</li>
 * </ul>
 *
 * <p>Tên theo quy ước quá khứ (past tense) theo DOMAIN_EVENTS.md.</p>
 *
 * @param tenantId    UUID tenant vừa được tạo
 * @param ownerUserId UUID owner (user đăng ký)
 * @param planSlug    gói dịch vụ đã chọn (basic, professional, enterprise)
 * @param occurredAt  thời điểm sự kiện xảy ra
 * @author SmartF&B Team
 * @since 2026-03-27
 */
public record TenantRegisteredEvent(
        UUID    tenantId,
        UUID    ownerUserId,
        String  planSlug,
        Instant occurredAt
) {}
