package com.smartfnb.plan.application;

import com.smartfnb.auth.infrastructure.persistence.PlanJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.PlanRepository;
import com.smartfnb.auth.infrastructure.persistence.TenantJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.TenantRepository;
import com.smartfnb.branch.infrastructure.persistence.BranchJpaRepository;
import com.smartfnb.plan.application.dto.*;
import com.smartfnb.plan.infrastructure.persistence.*;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service quản lý Tenant dành cho SYSTEM_ADMIN.
 * Cung cấp: danh sách tenant (filter, phân trang), chi tiết, suspend, reactivate, đổi gói.
 *
 * @author vutq
 * @since 2026-04-24
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TenantAdminService {

    private final AdminTenantJpaRepository adminTenantRepository;
    private final TenantRepository tenantRepository;
    private final PlanRepository planRepository;
    private final SubscriptionJpaRepository subscriptionRepository;
    private final SubscriptionInvoiceJpaRepository invoiceRepository;
    private final BranchJpaRepository branchJpaRepository;

    /**
     * Lấy danh sách tenant có phân trang và filter động.
     *
     * @param statusFilter lọc theo trạng thái (ACTIVE/SUSPENDED/CANCELLED), null = tất cả
     * @param planIdFilter lọc theo gói dịch vụ, null = tất cả
     * @param keyword      từ khóa tìm kiếm trong tên/email tenant, null/blank = bỏ qua
     * @param pageable     phân trang và sắp xếp
     * @return Page TenantSummaryResponse
     */
    @Transactional(readOnly = true)
    public Page<TenantSummaryResponse> getTenants(String statusFilter,
                                                   UUID planIdFilter,
                                                   String keyword,
                                                   Pageable pageable) {
        // Kết hợp specification động
        Specification<TenantJpaEntity> spec = Specification
                .where(TenantSpecification.hasStatus(statusFilter))
                .and(TenantSpecification.hasPlanId(planIdFilter))
                .and(TenantSpecification.nameOrEmailContains(keyword));

        Page<TenantJpaEntity> tenantPage = adminTenantRepository.findAll(spec, pageable);

        // Lấy map planId → planName để tránh N+1 query
        List<UUID> planIds = tenantPage.getContent().stream()
                .map(TenantJpaEntity::getPlanId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        Map<UUID, String> planNameMap = planRepository.findAllById(planIds).stream()
                .collect(Collectors.toMap(PlanJpaEntity::getId, PlanJpaEntity::getName));

        List<TenantSummaryResponse> content = tenantPage.getContent().stream()
                .map(tenant -> {
                    String planName = tenant.getPlanId() != null
                            ? planNameMap.getOrDefault(tenant.getPlanId(), "Không xác định")
                            : "Chưa có gói";
                    long branchCount = branchJpaRepository.countByTenantId(tenant.getId());
                    return TenantSummaryResponse.from(tenant, planName, branchCount);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, tenantPage.getTotalElements());
    }

    /**
     * Lấy chi tiết đầy đủ một tenant (bao gồm lịch sử subscription).
     *
     * @param tenantId ID của tenant
     * @return TenantDetailResponse
     * @throws SmartFnbException 404 nếu không tìm thấy
     */
    @Transactional(readOnly = true)
    public TenantDetailResponse getTenantDetail(UUID tenantId) {
        TenantJpaEntity tenant = findTenantOrThrow(tenantId);

        String planName = resolvePlanName(tenant.getPlanId());
        long branchCount = branchJpaRepository.countByTenantId(tenantId);

        // Lịch sử subscription: lấy tất cả, mới nhất trước
        List<SubscriptionJpaEntity> subscriptions = subscriptionRepository
                .findAllByTenantIdOrderByCreatedAtDesc(tenantId);
        List<SubscriptionResponse> subscriptionHistory = subscriptions.stream()
                .map(sub -> {
                    PlanResponse planResponse = planRepository.findById(sub.getPlanId())
                            .map(PlanResponse::fromEntity)
                            .orElse(null);
                    return SubscriptionResponse.fromEntity(sub, planResponse);
                })
                .collect(Collectors.toList());

        // Tổng số hóa đơn thực tế từ bảng subscription_invoices
        long totalInvoices = invoiceRepository.countByTenantId(tenantId);

        return TenantDetailResponse.from(tenant, planName, branchCount,
                subscriptionHistory, totalInvoices);
    }

    /**
     * Tạm khóa tenant (SUSPENDED).
     * Tenant bị khóa sẽ không thể đăng nhập vào hệ thống.
     *
     * @param tenantId ID của tenant
     * @param reason   Lý do khóa (ghi vào audit sau)
     * @throws SmartFnbException 404 nếu không tìm thấy, 409 nếu đã suspended
     */
    @Transactional
    public void suspendTenant(UUID tenantId, String reason) {
        TenantJpaEntity tenant = findTenantOrThrow(tenantId);

        if ("SUSPENDED".equals(tenant.getStatus())) {
            throw new SmartFnbException("TENANT_ALREADY_SUSPENDED",
                    "Tenant đã ở trạng thái bị khóa rồi", 409);
        }
        if ("CANCELLED".equals(tenant.getStatus())) {
            throw new SmartFnbException("TENANT_CANCELLED",
                    "Không thể suspend tenant đã bị hủy hoàn toàn", 409);
        }

        tenant.setStatus("SUSPENDED");
        tenantRepository.save(tenant);
        log.warn("SYSTEM_ADMIN đã suspend tenantId={}, lý do: {}", tenantId, reason);
    }

    /**
     * Mở khóa tenant (trở về ACTIVE).
     *
     * @param tenantId ID của tenant
     * @throws SmartFnbException 404 nếu không tìm thấy, 409 nếu không phải SUSPENDED
     */
    @Transactional
    public void reactivateTenant(UUID tenantId) {
        TenantJpaEntity tenant = findTenantOrThrow(tenantId);

        if (!"SUSPENDED".equals(tenant.getStatus())) {
            throw new SmartFnbException("TENANT_NOT_SUSPENDED",
                    "Chỉ có thể mở khóa tenant đang ở trạng thái SUSPENDED (hiện tại: "
                            + tenant.getStatus() + ")", 409);
        }

        tenant.setStatus("ACTIVE");
        tenantRepository.save(tenant);
        log.info("SYSTEM_ADMIN đã reactivate tenantId={}, name={}", tenantId, tenant.getName());
    }

    /**
     * Đổi/nâng cấp gói dịch vụ cho tenant.
     * Expire subscription cũ → tạo subscription ACTIVE mới.
     * Validate: số chi nhánh hiện tại ≤ maxBranches của gói mới.
     *
     * @param tenantId     ID tenant cần đổi gói
     * @param request      Thông tin gói mới và thời hạn
     * @return SubscriptionResponse sau khi đổi gói
     * @throws SmartFnbException 404 nếu không tìm thấy, 409 nếu vi phạm điều kiện
     */
    @Transactional
    public SubscriptionResponse changeTenantPlan(UUID tenantId, ChangeTenantPlanRequest request) {
        TenantJpaEntity tenant = findTenantOrThrow(tenantId);
        PlanJpaEntity newPlan = planRepository.findById(request.newPlanId())
                .orElseThrow(() -> new SmartFnbException("PLAN_NOT_FOUND",
                        "Gói dịch vụ mới không tồn tại: " + request.newPlanId(), 404));

        if (!newPlan.isActive()) {
            throw new SmartFnbException("PLAN_INACTIVE",
                    "Không thể chuyển sang gói dịch vụ đã bị ẩn", 409);
        }

        // Validate: số chi nhánh hiện tại không vượt giới hạn gói mới
        long currentBranchCount = branchJpaRepository.countByTenantId(tenantId);
        if (currentBranchCount > newPlan.getMaxBranches()) {
            throw new SmartFnbException("PLAN_BRANCH_LIMIT_EXCEEDED",
                    String.format("Gói '%s' chỉ cho phép tối đa %d chi nhánh, "
                                    + "tenant hiện có %d chi nhánh. Hãy xóa bớt trước.",
                            newPlan.getName(), newPlan.getMaxBranches(), currentBranchCount), 409);
        }

        // Expire subscription cũ nếu có
        subscriptionRepository.findFirstByTenantIdAndStatusInOrderByCreatedAtDesc(tenantId, java.util.List.of("ACTIVE", "PENDING_PAYMENT"))
                .ifPresent(oldSub -> {
                    oldSub.setStatus("EXPIRED");
                    subscriptionRepository.save(oldSub);
                });

        // Tạo subscription mới
        LocalDateTime newExpiresAt = request.newExpiresAt().atStartOfDay();
        SubscriptionJpaEntity newSubscription = SubscriptionJpaEntity.builder()
                .tenantId(tenantId)
                .planId(request.newPlanId())
                .status("ACTIVE")
                .startedAt(LocalDateTime.now())
                .expiresAt(newExpiresAt)
                .build();
        subscriptionRepository.save(newSubscription);

        // Cập nhật tenant
        tenant.setPlanId(request.newPlanId());
        tenant.setPlanExpiresAt(newExpiresAt);
        tenantRepository.save(tenant);

        log.info("SYSTEM_ADMIN đã đổi gói cho tenantId={} sang planId={}, hết hạn={}",
                tenantId, request.newPlanId(), newExpiresAt);

        return SubscriptionResponse.fromEntity(newSubscription, PlanResponse.fromEntity(newPlan));
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private TenantJpaEntity findTenantOrThrow(UUID tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new SmartFnbException("TENANT_NOT_FOUND",
                        "Tenant không tồn tại: " + tenantId, 404));
    }

    private String resolvePlanName(UUID planId) {
        if (planId == null) return "Chưa có gói";
        return planRepository.findById(planId)
                .map(PlanJpaEntity::getName)
                .orElse("Không xác định");
    }
}
