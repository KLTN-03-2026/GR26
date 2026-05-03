package com.smartfnb.plan.application;

import com.smartfnb.auth.domain.event.TenantRegisteredEvent;
import com.smartfnb.auth.infrastructure.persistence.PlanJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.PlanRepository;
import com.smartfnb.plan.application.dto.PlanResponse;
import com.smartfnb.plan.application.dto.SubscriptionResponse;
import com.smartfnb.plan.infrastructure.persistence.SubscriptionJpaEntity;
import com.smartfnb.plan.infrastructure.persistence.SubscriptionJpaRepository;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Dịch vụ quản lý các gói đăng ký của Tenant (Subscription).
 * Nơi xử lý TenantRegisteredEvent để cấp phát gói mặc định.
 *
 * @author vutq
 * @since 2026-03-27
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionJpaRepository subscriptionRepository;
    private final PlanRepository planRepository;

    /**
     * Nhận sự kiện Tenant tạo thành công để tự động assign plan cho Tenant đó.
     */
    @EventListener
    @Transactional
    public void onTenantRegistered(TenantRegisteredEvent event) {
        log.info("Subscription Module đang cấp plan {} cho tenantId={}", event.planSlug(), event.tenantId());

        PlanJpaEntity plan = planRepository.findBySlug(event.planSlug())
                .orElseThrow(() -> new SmartFnbException("PLAN_NOT_FOUND", "Gói dịch vụ mặc định không tồn tại: " + event.planSlug(), 404));

        boolean isPaidPlan = plan.getPriceMonthly().compareTo(java.math.BigDecimal.ZERO) > 0;

        SubscriptionJpaEntity subscription = SubscriptionJpaEntity.builder()
                .tenantId(event.tenantId())
                .planId(plan.getId())
                .status(isPaidPlan ? "PENDING_PAYMENT" : "ACTIVE")
                .startedAt(LocalDateTime.now())
                // VD: Hết hạn sau 30 ngày dùng thử (nếu giá = 0), ở đây gán null là dùng vĩnh viễn (hoặc cần thanh toán)
                .expiresAt(null)
                .build();

        subscriptionRepository.save(subscription);
        log.info("Cấp plan {} thành công cho tenantId={} với trạng thái {}", event.planSlug(), event.tenantId(), subscription.getStatus());
    }

    /**
     * Lấy thông tin subscription hiện tại của Tenant.
     */
    @Transactional(readOnly = true)
    public SubscriptionResponse getCurrentSubscription(UUID tenantId) {
        SubscriptionJpaEntity subscription = subscriptionRepository
                .findFirstByTenantIdAndStatusInOrderByCreatedAtDesc(tenantId, java.util.List.of("ACTIVE", "PENDING_PAYMENT"))
                .orElseThrow(() -> new SmartFnbException("SUBSCRIPTION_NOT_FOUND", "Tenant chưa đăng ký gói dịch vụ nào hoặc đã hết hạn", 404));

        PlanJpaEntity plan = planRepository.findById(subscription.getPlanId())
                .orElseThrow(() -> new SmartFnbException("PLAN_NOT_FOUND", "Gói dịch vụ không tồn tại trong hệ thống", 404));

        return SubscriptionResponse.fromEntity(subscription, PlanResponse.fromEntity(plan));
    }
}
