package com.smartfnb.report.web.controller;

import com.smartfnb.report.application.dto.GetRevenueReportRequest;
import com.smartfnb.report.application.dto.RevenueReportResult;
import com.smartfnb.report.application.dto.HourlyRevenueHeatmapResult;
import com.smartfnb.report.application.dto.TopItemsResult;
import com.smartfnb.report.application.dto.PaymentMethodBreakdownResult;
import com.smartfnb.report.application.query.*;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * REST Controller: Báo cáo doanh thu & sản phẩm (S-18).
 * Endpoints:
 * - GET /api/v1/reports/revenue — Báo cáo doanh thu
 * - GET /api/v1/reports/revenue/hourly-heatmap — Heatmap theo giờ
 * - GET /api/v1/reports/top-items — Top 10 sản phẩm bán chạy
 * - GET /api/v1/reports/payment-breakdown — Chi tiết thanh toán
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {
    
    private final GetRevenueReportQueryHandler getRevenueReportQueryHandler;
    private final GetHourlyRevenueHeatmapQueryHandler getHourlyRevenueHeatmapQueryHandler;
    private final GetTopItemsQueryHandler getTopItemsQueryHandler;
    private final GetPaymentMethodBreakdownQueryHandler getPaymentMethodBreakdownQueryHandler;
    
    /**
     * Lấy báo cáo doanh thu.
     * Filter: startDate, endDate, branchId (optional), groupBy (daily|weekly|monthly)
     * 
     * BẢO MẬT: Chỉ user có REPORT_REVENUE mới xem được.
     * Owner xem toàn tenant, Admin/Manager xem chi nhánh được gán.
     *
     * @param startDate Ngày bắt đầu (YYYY-MM-DD)
     * @param endDate Ngày kết thúc (YYYY-MM-DD)
     * @param branchId Chi nhánh (optional: null = all branches user có quyền)
     * @param groupBy Cách nhóm: daily, weekly, monthly (default: daily)
     */
    @GetMapping("/revenue")
    @PreAuthorize("hasAuthority('REPORT_REVENUE')")
    public ResponseEntity<ApiResponse<RevenueReportResult>> getRevenueReport(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestParam(required = false) UUID branchId,
            @RequestParam(defaultValue = "daily") String groupBy) {
        
        // Validation: startDate <= endDate
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("startDate must be before or equal to endDate");
        }
        
        log.info("GET /reports/revenue: startDate={}, endDate={}, branchId={}, groupBy={}",
            startDate, endDate, branchId, groupBy);
        
        GetRevenueReportQuery query = new GetRevenueReportQuery(
            TenantContext.getCurrentTenantId(),
            branchId,
            startDate,
            endDate,
            groupBy
        );
        
        RevenueReportResult result = getRevenueReportQueryHandler.handle(query);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
    
    /**
     * Lấy heatmap doanh thu theo giờ (0-23).
     * Dùng để render biểu đồ trong ngày.
     *
     * @param branchId Chi nhánh
     * @param date Ngày cần xem (YYYY-MM-DD)
     */
    @GetMapping("/revenue/hourly-heatmap")
    @PreAuthorize("hasAuthority('REPORT_REVENUE')")
    public ResponseEntity<ApiResponse<HourlyRevenueHeatmapResult>> getHourlyRevenueHeatmap(
            @RequestParam UUID branchId,
            @RequestParam(defaultValue = "") String date) {
        
        LocalDate reportDate = date.isEmpty() ? LocalDate.now() : LocalDate.parse(date);
        
        log.info("GET /reports/revenue/hourly-heatmap: branchId={}, date={}", branchId, reportDate);
        
        GetHourlyRevenueHeatmapQuery query = new GetHourlyRevenueHeatmapQuery(branchId, reportDate);
        HourlyRevenueHeatmapResult result = getHourlyRevenueHeatmapQueryHandler.handle(query);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
    
    /**
     * Lấy Top N sản phẩm bán chạy theo ngày.
     *
     * @param branchId Chi nhánh
     * @param date Ngày (YYYY-MM-DD)
     * @param limit Số lượng top items (default: 10)
     */
    @GetMapping("/top-items")
    @PreAuthorize("hasAuthority('REPORT_REVENUE')")
    public ResponseEntity<ApiResponse<TopItemsResult>> getTopItems(
            @RequestParam UUID branchId,
            @RequestParam(required = false) String date,
            @RequestParam(defaultValue = "10") int limit) {
        
        LocalDate reportDate = date == null || date.isEmpty() ? LocalDate.now() : LocalDate.parse(date);
        
        log.info("GET /reports/top-items: branchId={}, date={}, limit={}", branchId, reportDate, limit);
        
        GetTopItemsQuery query = new GetTopItemsQuery(branchId, reportDate, limit);
        TopItemsResult result = getTopItemsQueryHandler.handle(query);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
    
    /**
     * Lấy chi tiết thanh toán theo phương thức (Cash, MOMO, VIETQR, Banking).
     *
     * @param branchId Chi nhánh
     * @param date Ngày (YYYY-MM-DD, default: today)
     */
    @GetMapping("/payment-breakdown")
    @PreAuthorize("hasAuthority('REPORT_REVENUE')")
    public ResponseEntity<ApiResponse<PaymentMethodBreakdownResult>> getPaymentMethodBreakdown(
            @RequestParam UUID branchId,
            @RequestParam(required = false) String date) {
        
        LocalDate reportDate = date == null || date.isEmpty() ? LocalDate.now() : LocalDate.parse(date);
        
        log.info("GET /reports/payment-breakdown: branchId={}, date={}", branchId, reportDate);
        
        GetPaymentMethodBreakdownQuery query = new GetPaymentMethodBreakdownQuery(branchId, reportDate);
        PaymentMethodBreakdownResult result = getPaymentMethodBreakdownQueryHandler.handle(query);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
