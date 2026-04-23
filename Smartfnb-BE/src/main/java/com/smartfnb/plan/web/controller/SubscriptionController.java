package com.smartfnb.plan.web.controller;

import com.smartfnb.plan.application.SubscriptionService;
import com.smartfnb.plan.application.dto.SubscriptionResponse;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Controller để Tenant tra cứu thông tin gói dịch vụ đang sử dụng.
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    /**
     * Lấy thông tin gói dịch vụ hiện tại (ACTIVE) của Tenant.
     * Mọi nhân viên trong Tenant đều có thể gọi (hoặc tùy cấu hình quyền, hiện tại mở cho user auth).
     */
    @GetMapping("/current")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getCurrentSubscription() {
        UUID currentTenantId = TenantContext.getCurrentTenantId();
        SubscriptionResponse response = subscriptionService.getCurrentSubscription(currentTenantId);

        return ResponseEntity.ok(ApiResponse.ok(
                response
        ));
    }
}
