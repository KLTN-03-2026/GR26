package com.smartfnb.order.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;
import java.util.UUID;

public class OrderNotFoundException extends SmartFnbException {
    public OrderNotFoundException(UUID orderId) {
        super("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng với ID: " + orderId);
    }
}
