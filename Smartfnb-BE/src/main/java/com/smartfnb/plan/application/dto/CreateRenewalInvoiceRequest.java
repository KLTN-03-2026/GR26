package com.smartfnb.plan.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request tạo hóa đơn gia hạn gói dịch vụ cho Tenant.
 * Dùng cho POST /api/v1/admin/billing/invoices.
 *
 * @param tenantId ID của tenant cần gia hạn
 * @param planId   ID gói dịch vụ muốn gia hạn
 * @param months   Số tháng gia hạn (1-24)
 * @param note     Ghi chú của admin (tùy chọn)
 *
 * @author vutq
 * @since 2026-04-24
 */
public record CreateRenewalInvoiceRequest(

        @NotNull(message = "ID tenant không được null")
        UUID tenantId,

        @NotNull(message = "ID gói dịch vụ không được null")
        UUID planId,

        @Min(value = 1, message = "Số tháng tối thiểu là 1")
        @Max(value = 24, message = "Số tháng tối đa là 24")
        int months,

        /** Ghi chú từ admin — ví dụ: "Gia hạn ưu đãi khách hàng VIP" */
        String note
) {}
