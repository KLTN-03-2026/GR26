package com.smartfnb.menu.domain.exception;

import com.smartfnb.shared.exception.SmartFnbException;

import java.util.UUID;

/**
 * Exception khi không tìm thấy danh mục món ăn.
 * Trả về NOT_FOUND để tránh lộ thông tin nội bộ.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public class CategoryNotFoundException extends SmartFnbException {

    /**
     * Khởi tạo exception với ID danh mục không tìm thấy.
     *
     * @param categoryId ID danh mục cần tìm
     */
    public CategoryNotFoundException(UUID categoryId) {
        super("CATEGORY_NOT_FOUND",
              "Không tìm thấy danh mục với ID: " + categoryId);
    }
}
