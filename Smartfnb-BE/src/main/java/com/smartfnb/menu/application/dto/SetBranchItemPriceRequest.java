package com.smartfnb.menu.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * DTO request thiết lập giá riêng cho món ăn tại một chi nhánh.
 * branchId lấy từ path variable; itemId lấy từ path variable.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public record SetBranchItemPriceRequest(

        /**
         * Giá bán tại chi nhánh này.
         * null = xóa giá riêng, quay về dùng base_price.
         * Nếu cung cấp thì phải >= 0.
         */
        @DecimalMin(value = "0", message = "Giá bán không được âm")
        BigDecimal branchPrice,

        /** Trạng thái phục vụ tại chi nhánh — mặc định true */
        @NotNull(message = "Trạng thái phục vụ không được để trống")
        Boolean isAvailable
) {}
