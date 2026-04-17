package com.smartfnb.expense.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;
import java.util.UUID;

public class ExpenseNotFoundException extends SmartFnbException {
    public ExpenseNotFoundException(UUID id) {
        super("EXPENSE_NOT_FOUND", "Không tìm thấy hóa đơn chi với ID: " + id, 404);
    }
}
