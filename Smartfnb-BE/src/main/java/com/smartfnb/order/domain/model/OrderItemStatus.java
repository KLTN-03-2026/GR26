package com.smartfnb.order.domain.model;

/**
 * Trạng thái của từng món trong đơn.
 *
 * @author vutq
 */
public enum OrderItemStatus {
    PENDING,
    PROCESSING,
    READY,
    SERVED,
    CANCELLED
}
