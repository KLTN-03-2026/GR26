package com.smartfnb.plan.application;

import com.smartfnb.auth.infrastructure.persistence.PlanJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.PlanRepository;
import com.smartfnb.plan.application.dto.*;
import com.smartfnb.plan.application.port.PlanQRCodePort;
import com.smartfnb.plan.domain.event.SubscriptionInvoicePaidEvent;
import com.smartfnb.plan.infrastructure.persistence.SubscriptionInvoiceJpaEntity;
import com.smartfnb.plan.infrastructure.persistence.SubscriptionInvoiceJpaRepository;
import com.smartfnb.plan.infrastructure.persistence.SubscriptionJpaEntity;
import com.smartfnb.plan.infrastructure.persistence.SubscriptionJpaRepository;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service xử lý nghiệp vụ thanh toán gói dịch vụ dành cho Tenant (Owner tự gia hạn).
 *
 * <p>Luồng:
 * <ol>
 *   <li>Owner tạo hóa đơn gia hạn → UNPAID</li>
 *   <li>Owner gọi API sinh QR theo hóa đơn</li>
 *   <li>Gateway thanh toán → Webhook → Tự động đánh dấu PAID + gia hạn subscription</li>
 * </ol>
 * </p>
 *
 * <p><b>Kiến trúc:</b> Không import trực tiếp từ module payment.
 * Gọi module payment qua Port interface {@link PlanQRCodePort} → Adapter {@code PlanQRCodeAdapter}.</p>
 *
 * @author vutq
 * @since 2026-04-30
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TenantBillingService {

    private final SubscriptionInvoiceJpaRepository invoiceRepository;
    private final SubscriptionJpaRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final PlanQRCodePort planQRCodePort;  // Port — không phụ thuộc trực tiếp payment module

    // ─────────────────────────────────────────────────────────────────────────
    // 1. TẠO HÓA ĐƠN GIA HẠN
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Tạo hóa đơn gia hạn gói dịch vụ cho Tenant hiện tại.
     * tenantId được lấy từ JWT — chống Mass Assignment.
     *
     * @param request thông tin gói và số tháng muốn gia hạn
     * @return InvoiceResponse hóa đơn vừa tạo (UNPAID)
     * @throws SmartFnbException 404 nếu không có subscription ACTIVE hoặc plan không tồn tại
     * @throws SmartFnbException 409 nếu đã tồn tại hóa đơn UNPAID chưa xử lý
     */
    @Transactional
    public InvoiceResponse createRenewalInvoice(TenantRenewRequest request) {
        UUID tenantId = TenantContext.getCurrentTenantId();

        PlanJpaEntity plan = planRepository.findById(request.planId())
                .orElseThrow(() -> new SmartFnbException("PLAN_NOT_FOUND",
                        "Gói dịch vụ không tồn tại: " + request.planId(), 404));

        // Lấy subscription ACTIVE của tenant
        SubscriptionJpaEntity activeSubscription = subscriptionRepository
                .findFirstByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, "ACTIVE")
                .orElseThrow(() -> new SmartFnbException("SUBSCRIPTION_NOT_FOUND",
                        "Tenant chưa có gói dịch vụ ACTIVE. Liên hệ Admin để được hỗ trợ.", 404));

        // Guard: ngăn tạo 2 hóa đơn UNPAID cùng lúc cho cùng subscription
        if (invoiceRepository.existsBySubscriptionIdAndStatus(activeSubscription.getId(), "UNPAID")) {
            throw new SmartFnbException("DUPLICATE_UNPAID_INVOICE",
                    "Đã có hóa đơn chưa thanh toán. Vui lòng thanh toán hoặc chờ Admin hủy hóa đơn cũ trước.", 409);
        }

        // Tính chu kỳ dịch vụ: nối tiếp từ ngày hết hạn hiện tại, hoặc từ hôm nay nếu chưa có
        LocalDate periodStart = activeSubscription.getExpiresAt() != null
                ? activeSubscription.getExpiresAt().toLocalDate()
                : LocalDate.now();
        LocalDate periodEnd = periodStart.plusMonths(request.months());

        // Tính tiền: price_monthly × months
        BigDecimal amount = plan.getPriceMonthly().multiply(BigDecimal.valueOf(request.months()));

        // Sinh invoice number nguyên tử: INV-YYYYMM-NNNNN
        String prefix = "INV-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-";
        long count = invoiceRepository.countByInvoiceNumberStartingWith(prefix);
        String invoiceNumber = prefix + String.format("%05d", count + 1);

        SubscriptionInvoiceJpaEntity invoice = SubscriptionInvoiceJpaEntity.builder()
                .tenantId(tenantId)
                .subscriptionId(activeSubscription.getId())
                .planId(request.planId())
                .invoiceNumber(invoiceNumber)
                .amount(amount)
                .billingPeriodStart(periodStart)
                .billingPeriodEnd(periodEnd)
                .status("UNPAID")
                .note(request.note())
                .build();

        SubscriptionInvoiceJpaEntity saved = invoiceRepository.save(invoice);
        log.info("Tenant {} tạo hóa đơn {} — gói {}, {} tháng, amount={}",
                tenantId, invoiceNumber, plan.getName(), request.months(), amount);

        return InvoiceResponse.from(saved, null, plan.getName());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. SINH QR CODE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sinh mã QR để thanh toán hóa đơn gói dịch vụ.
     * Gọi qua Port interface — không phụ thuộc trực tiếp module payment.
     *
     * @param invoiceId UUID hóa đơn cần thanh toán
     * @param method    Phương thức QR: "VIETQR" hoặc "MOMO"
     * @return PlanQRPaymentResponse chứa URL QR và metadata
     * @throws SmartFnbException 404 nếu hóa đơn không thuộc tenant hiện tại (IDOR)
     * @throws SmartFnbException 400 nếu hóa đơn không ở trạng thái UNPAID
     * @throws SmartFnbException 400 nếu method QR không hỗ trợ
     */
    @Transactional(readOnly = true)
    public PlanQRPaymentResponse generatePaymentQR(UUID invoiceId, String method) {
        UUID tenantId = TenantContext.getCurrentTenantId();

        // IDOR protection: chỉ lấy hóa đơn thuộc tenantId từ JWT
        SubscriptionInvoiceJpaEntity invoice = invoiceRepository
                .findByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new SmartFnbException("INVOICE_NOT_FOUND",
                        "Không tìm thấy hóa đơn: " + invoiceId, 404));

        if (!"UNPAID".equals(invoice.getStatus())) {
            throw new SmartFnbException("INVOICE_NOT_UNPAID",
                    "Hóa đơn không ở trạng thái chờ thanh toán. Trạng thái hiện tại: " + invoice.getStatus(), 400);
        }

        try {
            // Gọi qua Port (không import trực tiếp payment module)
            PlanQRCodePort.QRResult qrResult = planQRCodePort.generateQR(
                    invoiceId, invoice.getAmount(), invoice.getInvoiceNumber(), method);

            log.info("Đã sinh QR {} cho hóa đơn {}", method, invoice.getInvoiceNumber());

            return new PlanQRPaymentResponse(
                    invoice.getId(),
                    invoice.getInvoiceNumber(),
                    invoice.getAmount(),
                    qrResult.qrCodeUrl(),
                    qrResult.qrCodeData(),
                    method.toUpperCase(),
                    qrResult.expiresInSeconds()
            );

        } catch (PlanQRCodePort.PlanQRCodeException e) {
            // Re-throw dưới dạng SmartFnbException để GlobalExceptionHandler xử lý
            throw new SmartFnbException("QR_GENERATION_FAILED",
                    "Không thể tạo mã QR: " + e.getMessage(), 400);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. XỬ LÝ WEBHOOK (THANH TOÁN TỰ ĐỘNG)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Xử lý callback webhook từ payment gateway sau khi User quét QR thành công.
     *
     * <p>Thiết kế idempotent: nếu webhook đến nhiều lần (gateway retry),
     * chỉ lần đầu có hiệu quả — các lần sau bị bỏ qua nếu hóa đơn đã PAID.</p>
     *
     * @param invoiceId     UUID của hóa đơn (= paymentId truyền cho gateway)
     * @param transactionId Mã giao dịch từ gateway
     * @param status        Trạng thái: "success" | "failed"
     * @param paymentMethod Phương thức: "VIETQR" | "MOMO"
     */
    @Transactional
    public void processWebhookPayment(UUID invoiceId, String transactionId,
                                      String status, String paymentMethod) {
        log.info("Nhận webhook plan payment: invoiceId={}, status={}, txId={}",
                invoiceId, status, transactionId);

        if (!"success".equalsIgnoreCase(status)) {
            log.warn("Webhook báo thất bại cho hóa đơn {}, status={}", invoiceId, status);
            return; // Không throw — trả 200 về gateway để ngừng retry
        }

        SubscriptionInvoiceJpaEntity invoice = invoiceRepository.findById(invoiceId)
                .orElse(null);

        if (invoice == null) {
            // Ghi log nhưng không throw để gateway không retry mãi
            log.error("Webhook nhận invoiceId không tồn tại: {}", invoiceId);
            return;
        }

        if (!"UNPAID".equals(invoice.getStatus())) {
            // Idempotent: hóa đơn đã xử lý, bỏ qua bình thường
            log.info("Hóa đơn {} đã ở trạng thái {}. Bỏ qua webhook (idempotent).",
                    invoiceId, invoice.getStatus());
            return;
        }

        // Đánh dấu PAID
        invoice.setStatus("PAID");
        invoice.setPaymentMethod(paymentMethod);
        invoice.setPaidAt(LocalDateTime.now());
        invoice.setNote("Thanh toán tự động qua " + paymentMethod + " — TxID: " + transactionId);
        invoiceRepository.save(invoice);

        // Gia hạn subscription
        renewSubscription(invoice);

        // Publish event — notification module có thể subscribe để gửi email thành công
        eventPublisher.publishEvent(new SubscriptionInvoicePaidEvent(
                invoice.getId(),
                invoice.getTenantId(),
                invoice.getSubscriptionId(),
                invoice.getInvoiceNumber(),
                invoice.getAmount(),
                paymentMethod,
                transactionId,
                Instant.now()
        ));

        log.info("Gia hạn thành công hóa đơn {} cho tenant {}",
                invoice.getInvoiceNumber(), invoice.getTenantId());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. QUERY — Danh sách hóa đơn của Tenant hiện tại (FIX N+1)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Lấy danh sách hóa đơn gói dịch vụ của Tenant đang đăng nhập.
     * tenantId lấy từ JWT — không thể xem hóa đơn của tenant khác.
     *
     * <p>Fix N+1: gom tất cả planId từ trang hiện tại → query 1 lần → build map.</p>
     *
     * @param pageable phân trang
     * @return Page&lt;InvoiceResponse&gt;
     */
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getMyInvoices(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenantId();

        Page<SubscriptionInvoiceJpaEntity> page =
                invoiceRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);

        // Fix N+1: collect tất cả planId trong trang → 1 query duy nhất
        Set<UUID> planIds = page.getContent().stream()
                .map(SubscriptionInvoiceJpaEntity::getPlanId)
                .collect(Collectors.toSet());

        Map<UUID, String> planNameMap = planRepository.findAllById(planIds).stream()
                .collect(Collectors.toMap(PlanJpaEntity::getId, PlanJpaEntity::getName));

        return page.map(entity -> {
            String planName = planNameMap.getOrDefault(entity.getPlanId(), "Không xác định");
            return InvoiceResponse.from(entity, null, planName);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Gia hạn subscription sau khi thanh toán thành công.
     * Set expires_at = billing_period_end của hóa đơn và cập nhật planId nếu user đổi gói.
     *
     * @param invoice hóa đơn đã được xác nhận PAID
     */
    private void renewSubscription(SubscriptionInvoiceJpaEntity invoice) {
        SubscriptionJpaEntity subscription = subscriptionRepository
                .findById(invoice.getSubscriptionId())
                .orElseThrow(() -> new SmartFnbException("SUBSCRIPTION_NOT_FOUND",
                        "Subscription không tồn tại: " + invoice.getSubscriptionId(), 500));

        // Cộng hạn đến billing_period_end của hóa đơn
        subscription.setExpiresAt(invoice.getBillingPeriodEnd().atStartOfDay());
        subscription.setPlanId(invoice.getPlanId());
        subscriptionRepository.save(subscription);

        log.info("Đã gia hạn subscription {} — expiresAt={}",
                subscription.getId(), invoice.getBillingPeriodEnd());
    }
}
