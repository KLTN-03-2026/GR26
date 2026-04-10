package com.smartfnb.order.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;
import com.smartfnb.order.domain.model.OrderStatus;

public class InvalidOrderStatusTransitionException extends SmartFnbException {
    public InvalidOrderStatusTransitionException(OrderStatus current, OrderStatus next) {
        super("INVALID_ORDER_STATUS_TRANSITION", 
              "Không thể đổi trạng thái đơn hàng từ " + current + " sang " + next);
    }
}
