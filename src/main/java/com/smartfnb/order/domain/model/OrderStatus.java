package com.smartfnb.order.domain.model;

/**
 * Trạng thái của đơn hàng.
 * PENDING -> PROCESSING -> COMPLETED | CANCELLED
 *
 * @author SmartF&B Team
 */
public enum OrderStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    CANCELLED
}
