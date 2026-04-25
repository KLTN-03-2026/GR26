package com.smartfnb.plan.application.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request đổi/nâng cấp gói dịch vụ cho một Tenant.
 * Dùng cho PUT /api/v1/admin/tenants/{id}/plan.
 *
 * @param newPlanId    ID gói dịch vụ mới
 * @param newExpiresAt ngày hết hạn gói mới
 * @param note         ghi chú của admin (lý do nâng cấp, ưu đãi...)
 *
 * @author vutq
 * @since 2026-04-24
 */
public record ChangeTenantPlanRequest(

        @NotNull(message = "ID gói dịch vụ mới không được null")
        UUID newPlanId,

        @NotNull(message = "Ngày hết hạn mới không được null")
        LocalDate newExpiresAt,

        /** Ghi chú từ admin — tùy chọn */
        String note
) {}
