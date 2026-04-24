package com.smartfnb.plan.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Request cập nhật thông tin gói dịch vụ.
 * Dùng cho PUT /api/v1/admin/plans/{id}.
 *
 * @author vutq
 * @since 2026-04-24
 */
public record UpdatePlanRequest(

        /** Tên mới của gói — không được trống */
        @NotBlank(message = "Tên gói không được để trống")
        String name,

        /** Giá theo tháng — phải > 0 (hoặc = 0 cho trial) */
        @NotNull(message = "Giá gói không được null")
        @Positive(message = "Giá gói phải lớn hơn 0")
        BigDecimal priceMonthly,

        /** Số chi nhánh tối đa — tối thiểu 1 */
        @Min(value = 1, message = "Số chi nhánh tối đa phải ít nhất là 1")
        int maxBranches,

        /**
         * Feature flags theo từng tính năng.
         * VD: {"POS": true, "INVENTORY": true, "PROMOTION": false, "AI": false}
         */
        @NotNull(message = "Danh sách features không được null")
        Map<String, Boolean> features,

        /** Kích hoạt hoặc ẩn gói khỏi danh sách public */
        boolean isActive
) {}
