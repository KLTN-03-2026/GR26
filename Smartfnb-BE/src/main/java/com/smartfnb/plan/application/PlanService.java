package com.smartfnb.plan.application;

import com.smartfnb.plan.domain.valueobject.FeatureFlag;
import com.smartfnb.auth.infrastructure.persistence.PlanJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.PlanRepository;
import com.smartfnb.plan.application.dto.PlanRequest;
import com.smartfnb.plan.application.dto.PlanResponse;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Xử lý nghiệp vụ gói dịch vụ (Plans).
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlanService {

    private final PlanRepository planRepository;

    /**
     * Lấy danh sách tất cả các gói dịch vụ (kể cả bị ẩn).
     */
    @Transactional(readOnly = true)
    public List<PlanResponse> getAllPlans() {
        return planRepository.findAll().stream()
                .map(PlanResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Tạo mới gói dịch vụ.
     */
    @Transactional
    public PlanResponse createPlan(PlanRequest request) {
        if (planRepository.findBySlug(request.slug()).isPresent()) {
            throw new SmartFnbException("PLAN_ALREADY_EXISTS", 
                    "Sulg gói dịch vụ đã tồn tại: " + request.slug(), 409);
        }

        PlanJpaEntity newPlan = PlanJpaEntity.builder()
                .name(request.name())
                .slug(request.slug())
                .priceMonthly(request.priceMonthly())
                .maxBranches(request.maxBranches())
                .isActive(request.isActive())
                .build();

        // Convert Map to JSON using FeatureFlag record logic
        String featuresJson = FeatureFlag.fromMap(request.features()).toJson();
        newPlan.setFeatures(featuresJson);

        newPlan = planRepository.save(newPlan);
        log.info("Đã tạo mới gói dịch vụ: {}", newPlan.getName());
        return PlanResponse.fromEntity(newPlan);
    }
}
