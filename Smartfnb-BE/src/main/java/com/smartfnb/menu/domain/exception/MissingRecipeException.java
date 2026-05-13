package com.smartfnb.menu.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

public class MissingRecipeException extends SmartFnbException {
    public MissingRecipeException(String itemName, UUID itemId) {
        super("MISSING_RECIPE", 
            String.format("Món '%s' chưa được cấu hình công thức (recipe), không thể đặt hàng.", itemName));
    }
}
