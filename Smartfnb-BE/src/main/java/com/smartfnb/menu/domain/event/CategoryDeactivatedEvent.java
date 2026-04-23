package com.smartfnb.menu.domain.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Sự kiện được phát khi danh mục bị vô hiệu hóa.
 * Consumer: MenuItem service cascade deactivate tất cả món trong danh mục.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record CategoryDeactivatedEvent(
        UUID categoryId,
        UUID tenantId,
        String categoryName,
        Instant occurredAt
) {}
