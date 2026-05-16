package com.smartfnb.plan.application;

// author: Hoàng | date: 2026-05-16 | note: Thêm PayOS billing — inject BillingPayOSProvider và SubscriptionPaymentAttemptJpaRepository.
//   generatePaymentQR() mở rộng xử lý PAYOS: tạo attempt, gọi PayOS billing provider, lưu kết quả.
//   Thêm processPayOSWebhook() cho webhook PayOS billing và syncPaymentStatus() cho polling.

import com.smartfnb.auth.infrastructure.persistence.PlanJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.PlanRepository;
import com.smartfnb.plan.application.dto.*;
import com.smartfnb.plan.application.port.PlanQRCodePort;
import com.smartfnb.plan.domain.event.SubscriptionInvoicePaidEvent;
import com.smartfnb.plan.infrastructure.external.BillingPayOSProvider;
import com.smartfnb.plan.infrastructure.persistence.SubscriptionInvoiceJpaEntity;
import com.smartfnb.plan.infrastructure.persistence.SubscriptionInvoiceJpaRepository;
import com.smartfnb.plan.infrastructure.persistence.SubscriptionJpaEntity;
import com.smartfnb.plan.infrastructure.persistence.SubscriptionJpaRepository;
import com.smartfnb.plan.infrastructure.persistence.SubscriptionPaymentAttemptJpaEntity;
import com.smartfnb.plan.infrastructure.persistence.SubscriptionPaymentAttemptJpaRepository;
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
    // author: Hoàng | date: 2026-05-16 | note: Inject thêm cho PayOS billing
    private final BillingPayOSProvider billingPayOSProvider;
    private final SubscriptionPaymentAttemptJpaRepository attemptRepository;

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

        // Lấy subscription ACTIVE hoặc PENDING_PAYMENT của tenant
        SubscriptionJpaEntity activeSubscription = subscriptionRepository
                .findFirstByTenantIdAndStatusInOrderByCreatedAtDesc(tenantId, java.util.List.of("ACTIVE", "PENDING_PAYMENT"))
                .orElseThrow(() -> new SmartFnbException("SUBSCRIPTION_NOT_FOUND",
                        "Tenant chưa có gói dịch vụ. Liên hệ Admin để được hỗ trợ.", 404));

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

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. SINH QR CODE
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Sinh mã QR để thanh toán hóa đơn gói dịch vụ.
     * Gọi qua Port interface — không phụ thuộc trực tiếp module payment.
     *
     * <p>Với PAYOS: tạo subscription_payment_attempts mới (PENDING),
     * gọi BillingPayOSProvider tạo link, lưu providerReference + orderCode.</p>
     *
     * @param invoiceId UUID hóa đơn cần thanh toán
     * @param method    Phương thức QR: "VIETQR" | "MOMO" | "PAYOS"
     * @return PlanQRPaymentResponse chứa URL QR và metadata
     * @throws SmartFnbException 404 nếu hóa đơn không thuộc tenant hiện tại (IDOR)
     * @throws SmartFnbException 400 nếu hóa đơn không ở trạng thái UNPAID
     * @throws SmartFnbException 400 nếu method QR không hỗ trợ
     * @author Hoàng | date: 2026-05-16 | note: Mở rộng xử lý PAYOS
     */
    @Transactional
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

        // author: Hoàng | date: 2026-05-16 | note: Phân nhánh xử lý PayOS billing và legacy QR (VietQR/MoMo)
        if ("PAYOS".equalsIgnoreCase(method)) {
            return generatePayOSPaymentQR(invoice, tenantId);
        }

        // Legacy flow: VietQR, MoMo qua PlanQRCodePort
        try {
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
                    qrResult.expiresInSeconds(),
                    null, null, null
            );

        } catch (PlanQRCodePort.PlanQRCodeException e) {
            throw new SmartFnbException("QR_GENERATION_FAILED",
                    "Không thể tạo mã QR: " + e.getMessage(), 400);
        }
    }

    // author: Hoàng | date: 2026-05-16
    private PlanQRPaymentResponse generatePayOSPaymentQR(
            SubscriptionInvoiceJpaEntity invoice, UUID tenantId) {

        SubscriptionPaymentAttemptJpaEntity attempt = attemptRepository.save(
                SubscriptionPaymentAttemptJpaEntity.builder()
                        .invoiceId(invoice.getId())
                        .tenantId(tenantId)
                        .provider("PAYOS")
                        .amount(invoice.getAmount())
                        .status("PENDING")
                        .build()
        );

        try {
            BillingPayOSProvider.BillingPayOSResult r = billingPayOSProvider.createPaymentLink(
                    attempt.getId(), invoice.getAmount(), invoice.getInvoiceNumber());

            attempt.setProviderReference(r.paymentLinkId());
            attempt.setProviderOrderCode(r.orderCode());
            attempt.setCheckoutUrl(r.checkoutUrl());
            attempt.setQrCode(r.qrCode());
            attempt.setExpiresAt(Instant.now().plusSeconds(r.expiresInSeconds()));
            attemptRepository.save(attempt);

            log.info("PAYOS billing: attemptId={}, invoiceId={}, orderCode={}",
                    attempt.getId(), invoice.getId(), r.orderCode());

            return new PlanQRPaymentResponse(
                    invoice.getId(), invoice.getInvoiceNumber(), invoice.getAmount(),
                    r.checkoutUrl(), r.qrCode(), "PAYOS", r.expiresInSeconds(),
                    r.paymentLinkId(), r.orderCode(), r.checkoutUrl());

        } catch (Exception e) {
            attempt.setStatus("FAILED");
            attemptRepository.save(attempt);
            throw e;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2.5. HỦY HÓA ĐƠN / PAYMENT ATTEMPT ĐỂ ĐỔI GÓI
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Owner hủy hóa đơn gói đang chờ thanh toán để chọn lại gói khác.
     *
     * <p>Chỉ hủy invoice thuộc tenant hiện tại và còn UNPAID. Nếu payment attempt PayOS
     * đã PAID trong lúc hủy, service sẽ đồng bộ invoice thành PAID thay vì hủy.</p>
     *
     * @param invoiceId UUID hóa đơn cần hủy
     * @return thông tin trạng thái sau khi xử lý hủy
     * @author Hoàng | date: 2026-05-16 | note: Không yêu cầu lý do hủy vì đây là thao tác đổi gói.
     */
    @Transactional
    public CancelTenantInvoiceResponse cancelTenantInvoice(UUID invoiceId) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        SubscriptionInvoiceJpaEntity invoice = invoiceRepository
                .findByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new SmartFnbException("INVOICE_NOT_FOUND",
                        "Không tìm thấy hóa đơn: " + invoiceId, 404));

        if ("CANCELLED".equals(invoice.getStatus())) {
            return buildCancelResponse(invoice, null, "Hóa đơn đã được hủy trước đó.");
        }

        if ("PAID".equals(invoice.getStatus())) {
            throw new SmartFnbException("INVOICE_ALREADY_PAID",
                    "Hóa đơn đã thanh toán nên không thể hủy.", 409);
        }

        if (!"UNPAID".equals(invoice.getStatus())) {
            throw new SmartFnbException("INVOICE_CANNOT_CANCEL",
                    "Chỉ có thể hủy hóa đơn đang chờ thanh toán. Trạng thái hiện tại: " + invoice.getStatus(), 409);
        }

        CancelAttemptResult attemptResult = cancelLatestPendingAttempt(invoice);
        if (attemptResult.justPaid()) {
            SubscriptionInvoiceJpaEntity paidInvoice = invoiceRepository.findById(invoiceId).orElse(invoice);
            return buildCancelResponse(paidInvoice, null,
                    "Hóa đơn vừa được xác nhận thanh toán, không thể hủy.");
        }

        invoice.setStatus("CANCELLED");
        invoice.setNote("Owner hủy hóa đơn để chọn lại gói");
        invoiceRepository.save(invoice);
        log.info("Owner hủy hóa đơn gói thành công: invoiceId={}, invoiceNumber={}, tenantId={}, cancelledAttemptId={}",
                invoice.getId(), invoice.getInvoiceNumber(), tenantId, attemptResult.cancelledAttemptId());

        return buildCancelResponse(invoice, attemptResult.cancelledAttemptId(),
                "Đã hủy hóa đơn chờ thanh toán. Bạn có thể chọn gói khác.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. XỬ LÝ WEBHOOK
    // ─────────────────────────────────────────────────────────────────────────

    /** Webhook legacy (VietQR/MoMo) — idempotent */
    @Transactional
    public void processWebhookPayment(UUID invoiceId, String transactionId,
                                      String status, String paymentMethod) {
        log.info("Webhook plan payment: invoiceId={}, status={}, txId={}", invoiceId, status, transactionId);
        if (!"success".equalsIgnoreCase(status)) { return; }
        markInvoicePaidInternal(invoiceId, paymentMethod, transactionId);
    }

    /**
     * Webhook PayOS billing — xác minh theo providerReference/orderCode.
     * Idempotent: nếu invoice đã PAID, trả về bình thường.
     *
     * @param paymentLinkId paymentLinkId từ PayOS webhook payload
     * @param orderCode     orderCode từ PayOS webhook payload
     * @param amount        amount từ PayOS webhook (để đối chiếu)
     * @param payosCode     "00" = thành công
     * @author Hoàng | date: 2026-05-16
     */
    @Transactional
    public void processPayOSWebhook(String paymentLinkId, long orderCode,
                                    BigDecimal amount, String payosCode) {
        log.info("PayOS billing webhook: paymentLinkId={}, orderCode={}, code={}",
                paymentLinkId, orderCode, payosCode);

        // Tìm attempt theo providerReference
        SubscriptionPaymentAttemptJpaEntity attempt = attemptRepository
                .findByProviderReference(paymentLinkId)
                .orElseGet(() -> attemptRepository.findByProviderOrderCode(orderCode).orElse(null));

        if (attempt == null) {
            log.warn("PayOS webhook: không tìm thấy attempt với paymentLinkId={} orderCode={}",
                    paymentLinkId, orderCode);
            return;
        }

        SubscriptionInvoiceJpaEntity invoice = invoiceRepository.findById(attempt.getInvoiceId()).orElse(null);
        if (invoice == null) { log.error("PayOS webhook: invoice không tồn tại: {}", attempt.getInvoiceId()); return; }

        // Idempotent
        if (!"UNPAID".equals(invoice.getStatus())) {
            log.info("PayOS webhook idempotent: invoice {} đã {}", invoice.getInvoiceNumber(), invoice.getStatus());
            return;
        }

        // Đối chiếu PayOS code
        if (!"00".equals(payosCode)) {
            log.warn("PayOS webhook code không phải 00: code={}, invoiceId={}", payosCode, invoice.getId());
            attempt.setStatus("FAILED");
            attemptRepository.save(attempt);
            return;
        }

        // Đối chiếu amount (chênh lệch ≤ 1 VND do rounding)
        if (amount != null && invoice.getAmount().subtract(amount).abs().compareTo(BigDecimal.ONE) > 0) {
            log.error("PayOS webhook amount mismatch: expected={}, received={}", invoice.getAmount(), amount);
            return;
        }

        // Đánh attempt PAID
        attempt.setStatus("PAID");
        attempt.setPaidAt(Instant.now());
        attemptRepository.save(attempt);

        markInvoicePaidInternal(invoice.getId(), "PAYOS", paymentLinkId);
    }

    /**
     * Kiểm tra trạng thái PayOS qua polling API — dùng cho dev/local khi webhook không chạy.
     * Chỉ Owner của tenant hiện tại mới gọi được endpoint này.
     *
     * @param invoiceId UUID hóa đơn cần kiểm tra
     * @return true nếu vừa đánh PAID, false nếu chưa thanh toán hoặc đã PAID trước đó
     * @author Hoàng | date: 2026-05-16
     */
    @Transactional
    public boolean syncPaymentStatus(UUID invoiceId) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        SubscriptionInvoiceJpaEntity invoice = invoiceRepository
                .findByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new SmartFnbException("INVOICE_NOT_FOUND", "Không tìm thấy hóa đơn: " + invoiceId, 404));

        if (!"UNPAID".equals(invoice.getStatus())) return false;

        SubscriptionPaymentAttemptJpaEntity attempt = attemptRepository
                .findFirstByInvoiceIdOrderByCreatedAtDesc(invoiceId).orElse(null);
        if (attempt == null || attempt.getProviderOrderCode() == null) return false;
        if (!"PAYOS".equals(attempt.getProvider())) return false;

        String payosStatus = billingPayOSProvider.checkPaymentStatus(attempt.getProviderOrderCode());
        log.info("PayOS polling: invoiceId={}, orderCode={}, status={}", invoiceId, attempt.getProviderOrderCode(), payosStatus);

        if ("PAID".equals(payosStatus)) {
            attempt.setStatus("PAID");
            attempt.setPaidAt(Instant.now());
            attemptRepository.save(attempt);
            markInvoicePaidInternal(invoiceId, "PAYOS", String.valueOf(attempt.getProviderOrderCode()));
            return true;
        }
        return false;
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
     * Hủy attempt mới nhất của invoice nếu attempt còn PENDING.
     *
     * <p>Với PayOS, backend gọi API cancel payment link trước khi hủy invoice nội bộ.
     * Nếu PayOS báo PAID ở bất kỳ bước nào, invoice được đánh PAID để tránh lệch tiền.</p>
     *
     * @param invoice hóa đơn đang cần hủy
     * @return kết quả hủy attempt hoặc trạng thái vừa paid
     * @author Hoàng | date: 2026-05-16
     */
    private CancelAttemptResult cancelLatestPendingAttempt(SubscriptionInvoiceJpaEntity invoice) {
        SubscriptionPaymentAttemptJpaEntity attempt = attemptRepository
                .findFirstByInvoiceIdOrderByCreatedAtDesc(invoice.getId())
                .orElse(null);

        if (attempt == null || !"PENDING".equals(attempt.getStatus())) {
            return CancelAttemptResult.notTouched();
        }

        if ("PAYOS".equalsIgnoreCase(attempt.getProvider()) && attempt.getProviderOrderCode() != null) {
            return cancelPayOSAttempt(invoice, attempt);
        }

        attempt.setStatus("CANCELLED");
        attemptRepository.save(attempt);
        return CancelAttemptResult.cancelled(attempt.getId());
    }

    /**
     * Hủy payment attempt PayOS đang PENDING.
     *
     * @param invoice hóa đơn chứa attempt
     * @param attempt attempt PayOS cần hủy
     * @return kết quả hủy hoặc justPaid nếu PayOS đã thanh toán
     * @author Hoàng | date: 2026-05-16
     */
    private CancelAttemptResult cancelPayOSAttempt(
            SubscriptionInvoiceJpaEntity invoice,
            SubscriptionPaymentAttemptJpaEntity attempt) {

        long orderCode = attempt.getProviderOrderCode();
        String gatewayStatus = billingPayOSProvider.checkPaymentStatus(orderCode);
        if ("PAID".equals(gatewayStatus)) {
            markAttemptAndInvoicePaid(attempt, invoice);
            return CancelAttemptResult.paid();
        }

        if ("CANCELLED".equals(gatewayStatus) || "EXPIRED".equals(gatewayStatus)) {
            attempt.setStatus(gatewayStatus);
            attemptRepository.save(attempt);
            return CancelAttemptResult.cancelled(attempt.getId());
        }

        try {
            billingPayOSProvider.cancelPaymentLink(orderCode);
            attempt.setStatus("CANCELLED");
            attemptRepository.save(attempt);
            return CancelAttemptResult.cancelled(attempt.getId());
        } catch (Exception e) {
            String statusAfterCancelError = billingPayOSProvider.checkPaymentStatus(orderCode);
            if ("PAID".equals(statusAfterCancelError)) {
                markAttemptAndInvoicePaid(attempt, invoice);
                return CancelAttemptResult.paid();
            }
            if ("CANCELLED".equals(statusAfterCancelError) || "EXPIRED".equals(statusAfterCancelError)) {
                attempt.setStatus(statusAfterCancelError);
                attemptRepository.save(attempt);
                return CancelAttemptResult.cancelled(attempt.getId());
            }

            throw new SmartFnbException("PAYOS_CANCEL_FAILED",
                    "Không thể hủy link thanh toán PayOS. Vui lòng thử lại sau.", 502);
        }
    }

    /**
     * Đánh attempt và invoice là đã thanh toán khi PayOS báo PAID trong lúc hủy.
     *
     * @param attempt attempt PayOS đã thanh toán
     * @param invoice hóa đơn tương ứng
     * @author Hoàng | date: 2026-05-16
     */
    private void markAttemptAndInvoicePaid(
            SubscriptionPaymentAttemptJpaEntity attempt,
            SubscriptionInvoiceJpaEntity invoice) {

        attempt.setStatus("PAID");
        attempt.setPaidAt(Instant.now());
        attemptRepository.save(attempt);
        String transactionId = attempt.getProviderReference() != null
                ? attempt.getProviderReference()
                : String.valueOf(attempt.getProviderOrderCode());
        markInvoicePaidInternal(invoice.getId(), "PAYOS", transactionId);
    }

    /**
     * Tạo response cho API hủy invoice gói.
     *
     * @param invoice hóa đơn sau khi xử lý
     * @param cancelledAttemptId attempt đã hủy nếu có
     * @param message thông điệp nghiệp vụ cho FE
     * @return response chuẩn cho controller
     * @author Hoàng | date: 2026-05-16
     */
    private CancelTenantInvoiceResponse buildCancelResponse(
            SubscriptionInvoiceJpaEntity invoice,
            UUID cancelledAttemptId,
            String message) {

        return new CancelTenantInvoiceResponse(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getStatus(),
                cancelledAttemptId,
                message
        );
    }

    /**
     * Kết quả hủy payment attempt mới nhất.
     *
     * @param cancelledAttemptId attempt đã hủy, null nếu không có attempt cần hủy
     * @param justPaid true khi gateway báo hóa đơn vừa được thanh toán
     * @author Hoàng | date: 2026-05-16
     */
    private record CancelAttemptResult(UUID cancelledAttemptId, boolean justPaid) {
        static CancelAttemptResult notTouched() {
            return new CancelAttemptResult(null, false);
        }

        static CancelAttemptResult cancelled(UUID attemptId) {
            return new CancelAttemptResult(attemptId, false);
        }

        static CancelAttemptResult paid() {
            return new CancelAttemptResult(null, true);
        }
    }

    /**
     * Helper chung: đánh invoice PAID + gia hạn subscription + publish event.
     * Dùng bởi processWebhookPayment (legacy) và processPayOSWebhook.
     * Caller phải đảm bảo invoice còn UNPAID trước khi gọi.
     *
     * @author Hoàng | date: 2026-05-16
     */
    private void markInvoicePaidInternal(UUID invoiceId, String paymentMethod, String transactionId) {
        SubscriptionInvoiceJpaEntity invoice = invoiceRepository.findById(invoiceId).orElse(null);
        if (invoice == null) { log.error("markInvoicePaidInternal: invoice không tồn tại: {}", invoiceId); return; }
        if (!"UNPAID".equals(invoice.getStatus())) { return; } // idempotent guard

        invoice.setStatus("PAID");
        invoice.setPaymentMethod(paymentMethod);
        invoice.setPaidAt(LocalDateTime.now());
        invoice.setNote("Thanh toán tự động qua " + paymentMethod + " — TxID: " + transactionId);
        invoiceRepository.save(invoice);

        renewSubscription(invoice);

        eventPublisher.publishEvent(new SubscriptionInvoicePaidEvent(
                invoice.getId(), invoice.getTenantId(), invoice.getSubscriptionId(),
                invoice.getInvoiceNumber(), invoice.getAmount(), paymentMethod, transactionId, Instant.now()));

        log.info("Gia hạn thành công hóa đơn {} cho tenant {}", invoice.getInvoiceNumber(), invoice.getTenantId());
    }

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
        subscription.setStatus("ACTIVE");
        subscriptionRepository.save(subscription);

        log.info("Đã gia hạn subscription {} — expiresAt={}",
                subscription.getId(), invoice.getBillingPeriodEnd());
    }
}
