package com.smartfnb.supplier.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

/**
 * Ném khi cố chuyển trạng thái đơn mua hàng không hợp lệ.
 */
public class InvalidPurchaseOrderStatusException extends SmartFnbException {
    public InvalidPurchaseOrderStatusException(String currentStatus, String targetStatus) {
        super("INVALID_PO_STATUS",
              "Không thể chuyển trạng thái từ " + currentStatus + " sang " + targetStatus);
    }
}
