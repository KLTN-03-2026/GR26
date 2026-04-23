package com.smartfnb.forecast.web.controller;

import com.smartfnb.forecast.application.dto.*;
import com.smartfnb.forecast.application.service.InventoryForecastService;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller cung cấp API dự báo tồn kho AI cho FE.
 * TenantId được lấy từ TenantContext (đã set bởi JwtAuthFilter) — không nhận từ request body.
 *
 * <p>Endpoints (theo convention /api/v1/ của dự án):</p>
 * <ul>
 *   <li>GET /api/v1/inventory/forecast/{branchId} — dự báo đầy đủ</li>
 *   <li>GET /api/v1/inventory/forecast/{branchId}/summary — tóm tắt theo urgency</li>
 *   <li>GET /api/v1/inventory/forecast/{branchId}/ingredient/{ingredientId} — theo nguyên liệu</li>
 *   <li>POST /api/v1/inventory/train/trigger — trigger train thủ công</li>
 *   <li>GET /api/v1/inventory/train/status — trạng thái model</li>
 * </ul>
 *
 * @author Hoàng
 * @since 2026-04-23
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryForecastController {

    private final InventoryForecastService forecastService;

    /**
     * Lấy toàn bộ dự báo tồn kho cho chi nhánh.
     * Trả về danh sách nguyên liệu sắp xếp theo mức độ cấp bách.
     *
     * @param branchId UUID chi nhánh
     * @return ForecastResponseDTO với ingredients và confidence
     */
    @GetMapping("/forecast/{branchId}")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ResponseEntity<ApiResponse<ForecastResponseDTO>> getForecast(
            @PathVariable String branchId) {

        String tenantId = TenantContext.requireCurrentTenantId().toString();
        log.debug("GET forecast: branch={}, tenant={}", branchId, tenantId);

        ForecastResponseDTO response = forecastService.getForecast(branchId, tenantId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Lấy tóm tắt số lượng nguyên liệu theo mức độ cấp bách (critical/warning/ok).
     *
     * @param branchId UUID chi nhánh
     * @return ForecastSummaryDTO với urgentCount, warningCount, okCount
     */
    @GetMapping("/forecast/{branchId}/summary")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ResponseEntity<ApiResponse<ForecastSummaryDTO>> getSummary(
            @PathVariable String branchId) {

        String tenantId = TenantContext.requireCurrentTenantId().toString();
        ForecastSummaryDTO summary = forecastService.getSummary(branchId, tenantId);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    /**
     * Lấy dự báo chi tiết cho 1 nguyên liệu cụ thể.
     *
     * @param branchId     UUID chi nhánh
     * @param ingredientId UUID nguyên liệu
     * @return IngredientForecastDTO với danh sách ngày dự báo
     */
    @GetMapping("/forecast/{branchId}/ingredient/{ingredientId}")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ResponseEntity<ApiResponse<IngredientForecastDTO>> getForecastByIngredient(
            @PathVariable String branchId,
            @PathVariable String ingredientId) {

        String tenantId = TenantContext.requireCurrentTenantId().toString();
        IngredientForecastDTO dto =
                forecastService.getForecastByIngredient(branchId, tenantId, ingredientId);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    /**
     * Trigger train model AI thủ công cho tenant hiện tại.
     * Chỉ OWNER hoặc ADMIN mới được phép trigger.
     * Fire-and-forget — response ngay lập tức, không chờ train hoàn thành.
     *
     * @param request HttpServletRequest để extract JWT token forward cho AI Service
     * @return message xác nhận đã gửi yêu cầu
     */
    @PostMapping("/train/trigger")
    @PreAuthorize("hasAuthority('INVENTORY_MANAGE')")
    public ResponseEntity<ApiResponse<String>> triggerTrain(HttpServletRequest request) {
        String tenantId = TenantContext.requireCurrentTenantId().toString();
        String jwtToken = extractBearerToken(request);

        log.info("Trigger train thủ công: tenant={}, user={}",
                tenantId, TenantContext.getCurrentUserId());

        forecastService.triggerTrain(tenantId, jwtToken);
        return ResponseEntity.ok(ApiResponse.ok("Train job đã được khởi động cho tenant: " + tenantId));
    }

    /**
     * Lấy trạng thái train model cho 1 chi nhánh.
     *
     * @param branchId UUID chi nhánh (query param)
     * @return TrainStatusDTO với lastTrainedAt, status, confidenceStars
     */
    @GetMapping("/train/status")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ResponseEntity<ApiResponse<TrainStatusDTO>> getTrainStatus(
            @RequestParam String branchId) {

        String tenantId = TenantContext.requireCurrentTenantId().toString();
        TrainStatusDTO status = forecastService.getTrainStatus(tenantId, branchId);
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    /**
     * Extract Bearer token từ Authorization header để forward cho AI Service.
     *
     * @param request HTTP request
     * @return token string hoặc empty string nếu không có
     */
    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return "";
    }
}
