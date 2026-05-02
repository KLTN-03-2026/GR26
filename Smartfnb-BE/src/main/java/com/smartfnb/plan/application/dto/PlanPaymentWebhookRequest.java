package com.smartfnb.plan.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request nhận webhook từ payment gateway sau khi User quét QR thanh toán gói dịch vụ.
 *
 * <p>Gateway POST về endpoint: {@code POST /api/v1/tenant/billing/webhook/qr}</p>
 *
 * @param invoiceId     UUID hóa đơn (= paymentId được gửi cho gateway lúc sinh QR)
 * @param transactionId Mã giao dịch từ gateway
 * @param status        Kết quả: "success" | "failed" | "expired"
 * @param amount        Số tiền gateway xác nhận (để đối chiếu)
 * @param paymentMethod Phương thức: "VIETQR" | "MOMO"
 *
 * @author vutq
 * @since 2026-04-30
 */
public record PlanPaymentWebhookRequest(

        @NotNull(message = "invoiceId không được null")
        UUID invoiceId,

        @NotBlank(message = "transactionId không được trống")
        String transactionId,

        @NotBlank(message = "status không được trống")
        String status,

        /** Số tiền gateway xác nhận — để đối chiếu với amount trong hóa đơn */
        BigDecimal amount,

        @NotBlank(message = "paymentMethod không được trống")
        String paymentMethod
) {}
