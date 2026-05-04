package com.smartfnb.plan.application;

import com.smartfnb.auth.infrastructure.persistence.PlanJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.PlanRepository;
import com.smartfnb.plan.application.dto.*;
import com.smartfnb.plan.domain.valueobject.FeatureFlag;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service quản lý gói dịch vụ (Plan) dành cho SYSTEM_ADMIN.
 * Bổ sung đầy đủ CRUD: update, deactivate, lấy chi tiết, danh sách phân trang.
 *
 * <p>Kế thừa logic từ {@link PlanService} (create + list).
 * Phân tách ra class riêng để tránh vi phạm SRP và tăng khả năng test.</p>
 *
 * @author vutq
 * @since 2026-04-24
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlanAdminService {

    private final PlanRepository planRepository;

    /**
     * Lấy chi tiết một gói dịch vụ theo ID.
     *
     * @param planId ID gói cần xem
     * @return PlanResponse
     * @throws SmartFnbException 404 nếu không tìm thấy
     */
    @Transactional(readOnly = true)
    public PlanResponse getPlanById(UUID planId) {
        PlanJpaEntity entity = findPlanOrThrow(planId);
        return PlanResponse.fromEntity(entity);
    }

    /**
     * Lấy danh sách gói dịch vụ có phân trang.
     * Nếu không truyền filter, trả về tất cả (cả active lẫn inactive).
     *
     * @param activeOnly null = tất cả, true = chỉ active, false = chỉ inactive
     * @param pageable   thông tin phân trang
     * @return PlanPageResponse phân trang
     */
    @Transactional(readOnly = true)
    public PlanPageResponse getPlans(Boolean activeOnly, Pageable pageable) {
        Page<PlanJpaEntity> page;
        if (activeOnly == null) {
            page = planRepository.findAll(pageable);
        } else {
            page = planRepository.findAllByIsActive(activeOnly, pageable);
        }
        List<PlanResponse> content = page.getContent().stream()
                .map(PlanResponse::fromEntity)
                .collect(Collectors.toList());

        return new PlanPageResponse(content, page.getNumber(), page.getSize(),
                page.getTotalPages(), page.getTotalElements());
    }

    /**
     * Cập nhật thông tin gói dịch vụ.
     * Không cho phép trùng slug với gói khác.
     *
     * @param planId  ID gói cần cập nhật
     * @param request Dữ liệu cập nhật mới
     * @return PlanResponse sau khi cập nhật
     * @throws SmartFnbException 404 nếu không tìm thấy, 409 nếu slug trùng
     */
    @Transactional
    public PlanResponse updatePlan(UUID planId, UpdatePlanRequest request) {
        PlanJpaEntity entity = findPlanOrThrow(planId);

        // Validate slug không trùng với gói khác (bỏ qua chính nó)
        if (planRepository.existsBySlugAndIdNot(entity.getSlug(), planId)) {
            throw new SmartFnbException("PLAN_SLUG_CONFLICT",
                    "Slug đã được sử dụng bởi gói dịch vụ khác: " + entity.getSlug(), 409);
        }

        // Cập nhật thông tin
        entity.setName(request.name());
        entity.setPriceMonthly(request.priceMonthly());
        entity.setMaxBranches(request.maxBranches());
        entity.setMaxStaff(request.maxStaff());
        entity.setMaxMenuItems(request.maxMenuItems());
        entity.setActive(request.isActive());

        // Cập nhật features: chuyển Map<String,Boolean> → FeatureFlag → JSON
        FeatureFlag ff = FeatureFlag.fromMap(request.features());
        entity.setFeatures(ff.toJson());

        PlanJpaEntity saved = planRepository.save(entity);
        log.info("SYSTEM_ADMIN đã cập nhật gói dịch vụ id={}, name={}", planId, request.name());
        return PlanResponse.fromEntity(saved);
    }

    /**
     * Deactivate (ẩn) gói dịch vụ.
     * Không cho phép deactivate nếu còn tenant ACTIVE đang dùng gói này.
     *
     * @param planId ID gói cần deactivate
     * @throws SmartFnbException 404 nếu không tìm thấy, 409 nếu còn tenant đang dùng
     */
    @Transactional
    public void deactivatePlan(UUID planId) {
        PlanJpaEntity entity = findPlanOrThrow(planId);

        // Guard: không deactivate gói có tenant đang dùng
        long activeTenantCount = planRepository.countActiveTenantsByPlanId(planId);
        if (activeTenantCount > 0) {
            throw new SmartFnbException("PLAN_HAS_ACTIVE_TENANTS",
                    "Không thể ẩn gói dịch vụ vì có " + activeTenantCount
                            + " tenant đang sử dụng. Hãy chuyển họ sang gói khác trước.", 409);
        }

        entity.setActive(false);
        planRepository.save(entity);
        log.info("SYSTEM_ADMIN đã deactivate gói dịch vụ id={}, name={}", planId, entity.getName());
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    /**
     * Tìm Plan theo ID, ném exception nếu không tồn tại.
     */
    private PlanJpaEntity findPlanOrThrow(UUID planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new SmartFnbException("PLAN_NOT_FOUND",
                        "Gói dịch vụ không tồn tại: " + planId, 404));
    }
}
