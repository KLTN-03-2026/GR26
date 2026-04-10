package com.smartfnb.order.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;
import java.util.UUID;

public class TableNotAvailableException extends SmartFnbException {
    public TableNotAvailableException(UUID tableId) {
        super("TABLE_NOT_AVAILABLE", "Bàn " + tableId + " hiện không trống để tạo đơn.");
    }
}
