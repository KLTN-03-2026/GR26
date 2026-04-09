package com.smartfnb.payment.infrastructure.persistence;

import java.util.UUID;

/**
 * Adapter để gọi Order Module API.
 * Implementation dùng RestTemplate hoặc gọi trực tiếp OrderRepository.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public interface OrderAdapter {
    /**
     * Lấy Order từ Order Module theo ID.
     */
    OrderDto getOrderById(UUID orderId);
}
