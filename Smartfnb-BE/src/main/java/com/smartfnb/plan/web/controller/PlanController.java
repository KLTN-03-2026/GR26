package com.smartfnb.plan.web.controller;

import com.smartfnb.plan.application.PlanService;
import com.smartfnb.plan.application.dto.PlanRequest;
import com.smartfnb.plan.application.dto.PlanResponse;
import com.smartfnb.shared.web.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller quản lý gói dịch vụ (Plans).
 * Chỉ SYSTEM_ADMIN mới được thực hiện các thao tác CRUD.
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@RestController
@RequestMapping("/api/v1/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    /**
     * Lấy danh sách tất cả các gói dịch vụ.
     * Cả user thường cũng có thể xem để biết có gói nào mới.
     * Hoặc Public nếu đặt ở register page.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PlanResponse>>> getAllPlans() {
        return ResponseEntity.ok(ApiResponse.ok(
                planService.getAllPlans()
        ));
    }

    /**
     * Tạo mới gói dịch vụ. Yêu cầu SYSTEM_ADMIN.
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<PlanResponse>> createPlan(@Valid @RequestBody PlanRequest request) {
        PlanResponse plan = planService.createPlan(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.ok(planService.createPlan(request))
        );}
}
