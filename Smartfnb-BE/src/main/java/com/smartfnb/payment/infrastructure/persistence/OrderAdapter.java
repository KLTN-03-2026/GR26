package com.smartfnb.payment.infrastructure.persistence;

import java.util.UUID;

/**
 * Adapter để gọi Order Module API.
 * Implementation dùng RestTemplate hoặc gọi trực tiếp OrderRepository.
 *
 * @author vutq
 * @since 2026-04-01
 */
public interface OrderAdapter {
    /**
     * Lấy Order từ Order Module theo ID.
     */
    OrderDto getOrderById(UUID orderId);

    /**
     * Lấy Order từ Order Module theo ID và Tenant ID (dùng khi không có context).
     */
    OrderDto getOrderById(UUID orderId, UUID tenantId);

    /**
     * Gọi Order Module chốt đơn và chuyển trạng thái về COMPLETED.
     */
    void completeOrder(UUID orderId, UUID tenantId, UUID branchId, UUID staffId);
}
