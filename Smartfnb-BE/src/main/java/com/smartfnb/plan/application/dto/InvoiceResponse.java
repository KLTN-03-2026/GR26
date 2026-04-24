package com.smartfnb.plan.application.dto;

import com.smartfnb.plan.infrastructure.persistence.SubscriptionInvoiceJpaEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response thông tin hóa đơn gói dịch vụ.
 * Dùng cho tất cả endpoint trong AdminBillingController.
 *
 * @author vutq
 * @since 2026-04-24
 */
public record InvoiceResponse(
        UUID id,

        /** Mã hóa đơn, bất biến: INV-YYYYMM-NNNNN */
        String invoiceNumber,

        UUID tenantId,

        /** Tên tenant — join từ service */
        String tenantName,

        UUID planId,

        /** Tên gói — join từ service */
        String planName,

        /** Số tiền phải thanh toán */
        BigDecimal amount,

        /** Ngày bắt đầu chu kỳ dịch vụ */
        LocalDate billingPeriodStart,

        /** Ngày kết thúc chu kỳ dịch vụ */
        LocalDate billingPeriodEnd,

        /** Trạng thái: UNPAID | PAID | CANCELLED */
        String status,

        /** Phương thức thanh toán (null nếu chưa thanh toán) */
        String paymentMethod,

        /** Thời điểm admin xác nhận thanh toán */
        LocalDateTime paidAt,

        /** Ghi chú của admin */
        String note,

        LocalDateTime createdAt
) {
    /**
     * Tạo InvoiceResponse từ entity và thông tin tên liên quan.
     *
     * @param entity     SubscriptionInvoiceJpaEntity
     * @param tenantName tên tenant
     * @param planName   tên gói dịch vụ
     * @return InvoiceResponse
     */
    public static InvoiceResponse from(SubscriptionInvoiceJpaEntity entity,
                                        String tenantName,
                                        String planName) {
        return new InvoiceResponse(
                entity.getId(),
                entity.getInvoiceNumber(),
                entity.getTenantId(),
                tenantName,
                entity.getPlanId(),
                planName,
                entity.getAmount(),
                entity.getBillingPeriodStart(),
                entity.getBillingPeriodEnd(),
                entity.getStatus(),
                entity.getPaymentMethod(),
                entity.getPaidAt(),
                entity.getNote(),
                entity.getCreatedAt()
        );
    }
}
