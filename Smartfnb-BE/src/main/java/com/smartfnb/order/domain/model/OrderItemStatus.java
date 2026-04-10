package com.smartfnb.order.domain.model;

/**
 * Trạng thái của từng món trong đơn.
 *
 * @author SmartF&B Team
 */
public enum OrderItemStatus {
    PENDING,
    PROCESSING,
    READY,
    SERVED,
    CANCELLED
}
