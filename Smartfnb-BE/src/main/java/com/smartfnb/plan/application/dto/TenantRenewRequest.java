package com.smartfnb.plan.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request tạo hóa đơn gia hạn gói dịch vụ dành cho Tenant (Owner tự gia hạn).
 *
 * <p>Khác với {@link CreateRenewalInvoiceRequest} dành cho Admin (phải truyền tenantId),
 * Request này không cần tenantId — hệ thống tự lấy từ JWT qua TenantContext.</p>
 *
 * @param planId ID gói dịch vụ muốn gia hạn
 * @param months Số tháng gia hạn (1-24)
 * @param note   Ghi chú của Owner (tùy chọn)
 *
 * @author vutq
 * @since 2026-04-30
 */
public record TenantRenewRequest(

        @NotNull(message = "ID gói dịch vụ không được null")
        UUID planId,

        @Min(value = 1, message = "Số tháng tối thiểu là 1")
        @Max(value = 24, message = "Số tháng tối đa là 24")
        int months,

        /** Ghi chú của Owner — ví dụ: "Gia hạn 3 tháng dùng thử thêm" */
        String note
) {}
