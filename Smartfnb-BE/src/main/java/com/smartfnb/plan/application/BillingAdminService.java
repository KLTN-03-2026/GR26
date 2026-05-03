package com.smartfnb.plan.application;

import com.smartfnb.auth.infrastructure.persistence.PlanJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.PlanRepository;
import com.smartfnb.auth.infrastructure.persistence.TenantJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.TenantRepository;
import com.smartfnb.plan.application.dto.CreateRenewalInvoiceRequest;
import com.smartfnb.plan.application.dto.InvoiceResponse;
import com.smartfnb.plan.domain.event.SubscriptionRenewedEvent;
import com.smartfnb.plan.infrastructure.persistence.*;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Service quản lý hóa đơn gói dịch vụ (Billing) dành cho SYSTEM_ADMIN.
 *
 * <p><b>Billing flow:</b>
 * <ol>
 *   <li>Admin tạo hóa đơn gia hạn (UNPAID) cho tenant</li>
 *   <li>Admin xác nhận thanh toán → PAID</li>
 *   <li>Tự động gia hạn subscription + cập nhật tenant.plan_expires_at</li>
 *   <li>Publish SubscriptionRenewedEvent (có thể gửi email thông báo)</li>
 * </ol>
 * </p>
 *
 * @author vutq
 * @since 2026-04-24
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BillingAdminService {

    private final SubscriptionInvoiceJpaRepository invoiceRepository;
    private final SubscriptionJpaRepository subscriptionRepository;
    private final TenantRepository tenantRepository;
    private final PlanRepository planRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Tạo hóa đơn gia hạn gói dịch vụ cho Tenant.
     * Hóa đơn được tạo với status UNPAID và chờ admin xác nhận thanh toán.
     *
     * @param request thông tin gia hạn (tenantId, planId, months)
     * @return InvoiceResponse hóa đơn vừa tạo
     * @throws SmartFnbException 404 nếu tenant/plan không tồn tại, 409 nếu đã có invoice UNPAID
     */
    @Transactional
    public InvoiceResponse createRenewalInvoice(CreateRenewalInvoiceRequest request) {
        TenantJpaEntity tenant = findTenantOrThrow(request.tenantId());
        PlanJpaEntity plan = findPlanOrThrow(request.planId());

        // Tìm subscription đang ACTIVE hoặc PENDING_PAYMENT của tenant
        SubscriptionJpaEntity activeSubscription = subscriptionRepository
                .findFirstByTenantIdAndStatusInOrderByCreatedAtDesc(request.tenantId(), java.util.List.of("ACTIVE", "PENDING_PAYMENT"))
                .orElseThrow(() -> new SmartFnbException("SUBSCRIPTION_NOT_FOUND",
                        "Tenant chưa có subscription hợp lệ để gia hạn. Hãy kiểm tra lại.", 404));

        // Guard: không tạo 2 hóa đơn UNPAID cho cùng 1 subscription
        if (invoiceRepository.existsBySubscriptionIdAndStatus(activeSubscription.getId(), "UNPAID")) {
            throw new SmartFnbException("DUPLICATE_UNPAID_INVOICE",
                    "Subscription này đã có hóa đơn chưa thanh toán. Xử lý hóa đơn cũ trước.", 409);
        }

        // Tính chu kỳ gia hạn: từ ngày hết hạn hiện tại hoặc từ hôm nay
        LocalDate periodStart = activeSubscription.getExpiresAt() != null
                ? activeSubscription.getExpiresAt().toLocalDate()
                : LocalDate.now();
        LocalDate periodEnd = periodStart.plusMonths(request.months());

        // Tính tiền: price_monthly × months
        BigDecimal amount = plan.getPriceMonthly()
                .multiply(BigDecimal.valueOf(request.months()));

        // Sinh invoice_number: INV-YYYYMM-XXXXX (5 chữ số tăng dần trong tháng)
        String prefix = "INV-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-";
        long count = invoiceRepository.countByInvoiceNumberStartingWith(prefix);
        String invoiceNumber = prefix + String.format("%05d", count + 1);

        SubscriptionInvoiceJpaEntity invoice = SubscriptionInvoiceJpaEntity.builder()
                .tenantId(request.tenantId())
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
        log.info("Đã tạo hóa đơn {} cho tenantId={}, plan={}, {} tháng, amount={}",
                invoiceNumber, request.tenantId(), plan.getName(), request.months(), amount);

        return InvoiceResponse.from(saved, tenant.getName(), plan.getName());
    }

    /**
     * Lấy danh sách tất cả hóa đơn có phân trang, có thể filter theo status.
     *
     * @param status   lọc theo trạng thái (UNPAID/PAID/CANCELLED), null = tất cả
     * @param pageable phân trang
     * @return Page<InvoiceResponse>
     */
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getAllInvoices(String status, Pageable pageable) {
        Page<SubscriptionInvoiceJpaEntity> page;
        if (status != null && !status.isBlank()) {
            page = invoiceRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase(), pageable);
        } else {
            page = invoiceRepository.findAll(pageable);
        }
        return page.map(invoice -> {
            String tenantName = tenantRepository.findById(invoice.getTenantId())
                    .map(TenantJpaEntity::getName).orElse("Không xác định");
            String planName = planRepository.findById(invoice.getPlanId())
                    .map(PlanJpaEntity::getName).orElse("Không xác định");
            return InvoiceResponse.from(invoice, tenantName, planName);
        });
    }

    /**
     * Lấy danh sách hóa đơn UNPAID (chưa thanh toán) để admin theo dõi.
     */
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getUnpaidInvoices(Pageable pageable) {
        return getAllInvoices("UNPAID", pageable);
    }

    /**
     * Lấy danh sách hóa đơn của một tenant cụ thể.
     *
     * @param tenantId ID tenant
     * @param pageable phân trang
     * @return Page<InvoiceResponse>
     */
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getInvoicesByTenant(UUID tenantId, Pageable pageable) {
        findTenantOrThrow(tenantId); // validate tenant tồn tại
        Page<SubscriptionInvoiceJpaEntity> page =
                invoiceRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
        String tenantName = tenantRepository.findById(tenantId)
                .map(TenantJpaEntity::getName).orElse("Không xác định");
        return page.map(invoice -> {
            String planName = planRepository.findById(invoice.getPlanId())
                    .map(PlanJpaEntity::getName).orElse("Không xác định");
            return InvoiceResponse.from(invoice, tenantName, planName);
        });
    }

    /**
     * Lấy chi tiết một hóa đơn.
     *
     * @param invoiceId ID hóa đơn
     * @return InvoiceResponse
     * @throws SmartFnbException 404 nếu không tìm thấy
     */
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceDetail(UUID invoiceId) {
        SubscriptionInvoiceJpaEntity invoice = findInvoiceOrThrow(invoiceId);
        String tenantName = tenantRepository.findById(invoice.getTenantId())
                .map(TenantJpaEntity::getName).orElse("Không xác định");
        String planName = planRepository.findById(invoice.getPlanId())
                .map(PlanJpaEntity::getName).orElse("Không xác định");
        return InvoiceResponse.from(invoice, tenantName, planName);
    }

    /**
     * Admin xác nhận thanh toán hóa đơn.
     * Sau khi PAID:
     * <ul>
     *   <li>Gia hạn subscription.expires_at += chu kỳ billing</li>
     *   <li>Cập nhật tenant.plan_expires_at</li>
     *   <li>Publish SubscriptionRenewedEvent</li>
     * </ul>
     *
     * @param invoiceId     ID hóa đơn
     * @param paymentMethod phương thức thanh toán (BANK_TRANSFER | MOMO | ZALOPAY | CASH)
     * @return InvoiceResponse sau khi cập nhật
     * @throws SmartFnbException 404 nếu không tìm thấy, 409 nếu không phải UNPAID
     */
    @Transactional
    public InvoiceResponse markInvoicePaid(UUID invoiceId, String paymentMethod) {
        SubscriptionInvoiceJpaEntity invoice = findInvoiceOrThrow(invoiceId);

        // Guard: chỉ xử lý UNPAID
        if (!"UNPAID".equals(invoice.getStatus())) {
            throw new SmartFnbException("INVOICE_NOT_UNPAID",
                    "Hóa đơn không ở trạng thái UNPAID (hiện tại: " + invoice.getStatus() + ")", 409);
        }

        // Cập nhật hóa đơn → PAID
        invoice.setStatus("PAID");
        invoice.setPaymentMethod(paymentMethod);
        invoice.setPaidAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        // Gia hạn subscription
        SubscriptionJpaEntity subscription = subscriptionRepository
                .findById(invoice.getSubscriptionId())
                .orElseThrow(() -> new SmartFnbException("SUBSCRIPTION_NOT_FOUND",
                        "Subscription không tồn tại", 500));

        LocalDateTime newExpiresAt = invoice.getBillingPeriodEnd().atStartOfDay();
        subscription.setExpiresAt(newExpiresAt);
        subscription.setStatus("ACTIVE");
        subscriptionRepository.save(subscription);

        // Cập nhật tenant.plan_expires_at
        tenantRepository.findById(invoice.getTenantId()).ifPresent(tenant -> {
            tenant.setPlanExpiresAt(newExpiresAt);
            tenantRepository.save(tenant);
        });

        // Publish domain event
        eventPublisher.publishEvent(new SubscriptionRenewedEvent(
                invoice.getTenantId(), invoice.getPlanId(), newExpiresAt, invoice.getInvoiceNumber()));

        log.info("Hóa đơn {} đã được xác nhận thanh toán bằng {}, subscription gia hạn đến {}",
                invoice.getInvoiceNumber(), paymentMethod, newExpiresAt);

        String tenantName = tenantRepository.findById(invoice.getTenantId())
                .map(TenantJpaEntity::getName).orElse("Không xác định");
        String planName = planRepository.findById(invoice.getPlanId())
                .map(PlanJpaEntity::getName).orElse("Không xác định");
        return InvoiceResponse.from(invoice, tenantName, planName);
    }

    /**
     * Hủy hóa đơn (chỉ hủy được khi UNPAID).
     *
     * @param invoiceId ID hóa đơn
     * @param reason    Lý do hủy
     * @throws SmartFnbException 404 không tìm thấy, 409 không phải UNPAID
     */
    @Transactional
    public void cancelInvoice(UUID invoiceId, String reason) {
        SubscriptionInvoiceJpaEntity invoice = findInvoiceOrThrow(invoiceId);

        if (!"UNPAID".equals(invoice.getStatus())) {
            throw new SmartFnbException("INVOICE_CANNOT_CANCEL",
                    "Chỉ có thể hủy hóa đơn ở trạng thái UNPAID (hiện tại: " + invoice.getStatus() + ")", 409);
        }

        invoice.setStatus("CANCELLED");
        invoice.setNote(reason);
        invoiceRepository.save(invoice);
        log.info("Hóa đơn {} đã bị hủy. Lý do: {}", invoice.getInvoiceNumber(), reason);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private TenantJpaEntity findTenantOrThrow(UUID tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new SmartFnbException("TENANT_NOT_FOUND",
                        "Tenant không tồn tại: " + tenantId, 404));
    }

    private PlanJpaEntity findPlanOrThrow(UUID planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new SmartFnbException("PLAN_NOT_FOUND",
                        "Gói dịch vụ không tồn tại: " + planId, 404));
    }

    private SubscriptionInvoiceJpaEntity findInvoiceOrThrow(UUID invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new SmartFnbException("INVOICE_NOT_FOUND",
                        "Hóa đơn không tồn tại: " + invoiceId, 404));
    }
}
