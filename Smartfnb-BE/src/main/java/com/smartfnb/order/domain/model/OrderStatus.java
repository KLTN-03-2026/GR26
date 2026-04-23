package com.smartfnb.order.domain.model;

/**
 * Trạng thái của đơn hàng.
 * PENDING -> PROCESSING -> COMPLETED | CANCELLED
 *
 * @author vutq
 */
public enum OrderStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    CANCELLED
}
