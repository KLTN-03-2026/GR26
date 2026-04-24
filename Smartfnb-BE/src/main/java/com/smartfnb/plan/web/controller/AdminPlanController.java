package com.smartfnb.plan.web.controller;

import com.smartfnb.plan.application.PlanAdminService;
import com.smartfnb.plan.application.PlanService;
import com.smartfnb.plan.application.dto.PlanPageResponse;
import com.smartfnb.plan.application.dto.PlanRequest;
import com.smartfnb.plan.application.dto.PlanResponse;
import com.smartfnb.plan.application.dto.UpdatePlanRequest;
import com.smartfnb.shared.web.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller Admin quản lý gói dịch vụ (Plans).
 * Tất cả endpoint yêu cầu role SYSTEM_ADMIN.
 *
 * <p>Giữ nguyên PlanController cũ ({@code /api/v1/plans}) để không break FE.
 * Controller này cung cấp thêm full CRUD tại {@code /api/v1/admin/plans}.</p>
 *
 * @author vutq
 * @since 2026-04-24
 */
@RestController
@RequestMapping("/api/v1/admin/plans")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class AdminPlanController {

    private final PlanAdminService planAdminService;
    private final PlanService planService;

    /**
     * Lấy danh sách gói dịch vụ có phân trang.
     * Filter theo trạng thái active nếu có.
     *
     * @param page       số trang (mặc định 0)
     * @param size       kích thước trang (mặc định 10)
     * @param activeOnly null = tất cả, true = chỉ active, false = chỉ inactive
     * @return PlanPageResponse
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PlanPageResponse>> getPlans(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Boolean activeOnly) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(planAdminService.getPlans(activeOnly, pageable)));
    }

    /**
     * Lấy chi tiết một gói dịch vụ theo ID.
     *
     * @param planId UUID của gói
     * @return PlanResponse
     */
    @GetMapping("/{planId}")
    public ResponseEntity<ApiResponse<PlanResponse>> getPlanById(@PathVariable UUID planId) {
        return ResponseEntity.ok(ApiResponse.ok(planAdminService.getPlanById(planId)));
    }

    /**
     * Lấy danh sách tất cả gói active — dùng cho select dropdown.
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<PlanResponse>>> getActivePlans() {
        return ResponseEntity.ok(ApiResponse.ok(planService.getAllPlans()));
    }

    /**
     * Tạo mới gói dịch vụ.
     *
     * @param request dữ liệu gói cần tạo
     * @return PlanResponse vừa tạo + HTTP 201
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PlanResponse>> createPlan(
            @Valid @RequestBody PlanRequest request) {
        PlanResponse created = planService.createPlan(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    /**
     * Cập nhật thông tin gói dịch vụ.
     *
     * @param planId  UUID gói cần cập nhật
     * @param request Dữ liệu mới
     * @return PlanResponse sau khi cập nhật
     */
    @PutMapping("/{planId}")
    public ResponseEntity<ApiResponse<PlanResponse>> updatePlan(
            @PathVariable UUID planId,
            @Valid @RequestBody UpdatePlanRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(planAdminService.updatePlan(planId, request)));
    }

    /**
     * Deactivate (ẩn) gói dịch vụ.
     * Không cho phép nếu còn tenant ACTIVE đang dùng gói này.
     *
     * @param planId UUID gói cần deactivate
     * @return HTTP 204 No Content
     */
    @DeleteMapping("/{planId}")
    public ResponseEntity<ApiResponse<Void>> deactivatePlan(@PathVariable UUID planId) {
        planAdminService.deactivatePlan(planId);
        return ResponseEntity.noContent().build();
    }
}
