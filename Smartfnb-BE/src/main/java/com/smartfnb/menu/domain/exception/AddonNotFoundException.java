package com.smartfnb.menu.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception khi không tìm thấy Addon/Topping.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public class AddonNotFoundException extends SmartFnbException {

    /**
     * Khởi tạo exception với ID addon không tìm thấy.
     *
     * @param addonId ID addon cần tìm
     */
    public AddonNotFoundException(UUID addonId) {
        super("ADDON_NOT_FOUND",
              "Không tìm thấy topping/addon với ID: " + addonId);
    }
}
