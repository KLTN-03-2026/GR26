package com.smartfnb.report.web.controller;

import com.smartfnb.report.application.dto.GetRevenueReportRequest;
import com.smartfnb.report.application.dto.RevenueReportResult;
import com.smartfnb.report.application.dto.HourlyRevenueHeatmapResult;
import com.smartfnb.report.application.dto.TopItemsResult;
import com.smartfnb.report.application.dto.PaymentMethodBreakdownResult;
import com.smartfnb.report.application.dto.inventory.InventoryStockDto;
import com.smartfnb.report.application.dto.inventory.InventoryMovementDto;
import com.smartfnb.report.application.dto.inventory.ExpiringItemsDto;
import com.smartfnb.report.application.dto.inventory.WasteReportDto;
import com.smartfnb.report.application.dto.inventory.CogsDto;
import com.smartfnb.report.application.dto.hr.AttendanceReportDto;
import com.smartfnb.report.application.dto.hr.PayrollReportDto;
import com.smartfnb.report.application.dto.hr.HrCostReportDto;
import com.smartfnb.report.application.dto.hr.ViolationReportDto;
import com.smartfnb.report.application.dto.hr.CheckinHistoryDto;
import com.smartfnb.report.application.query.*;
import com.smartfnb.report.application.query.inventory.*;
import com.smartfnb.report.application.query.hr.*;
import com.smartfnb.report.application.query.handler.inventory.*;
import com.smartfnb.report.application.query.handler.hr.*;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller: Báo cáo Module (S-18 & S-19).
 * 
 * S-18 Endpoints (Revenue Reports):
 * - GET /api/v1/reports/revenue — Báo cáo doanh thu
 * - GET /api/v1/reports/revenue/hourly-heatmap — Heatmap theo giờ
 * - GET /api/v1/reports/top-items — Top 10 sản phẩm bán chạy
 * - GET /api/v1/reports/payment-breakdown — Chi tiết thanh toán
 * 
 * S-19 Endpoints (HR & Inventory Reports):
 * - GET /api/v1/reports/inventory — Tồn kho
 * - GET /api/v1/reports/inventory/expiring — Items sắp hết hạn
 * - GET /api/v1/reports/inventory/movement — Chuyển động kho
 * - GET /api/v1/reports/inventory/waste — Báo cáo hao hụt
 * - GET /api/v1/reports/inventory/cogs — COGS (Cost of Goods Sold)
 * - GET /api/v1/reports/hr/attendance — Chấm công
 * - GET /api/v1/reports/payroll — Lương
 * - GET /api/v1/reports/hr/cost — Chi phí nhân sự
 * - GET /api/v1/reports/hr/violations — Vi phạm
 * - GET /api/v1/reports/hr/checkin-history — Lịch sử checkin
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Tag(name = "Reports", description = "API cho Module Báo cáo & Phân tích")
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {
    
    // S-18 Handlers (Revenue)
    private final GetRevenueReportQueryHandler getRevenueReportQueryHandler;
    private final GetHourlyRevenueHeatmapQueryHandler getHourlyRevenueHeatmapQueryHandler;
    private final GetTopItemsQueryHandler getTopItemsQueryHandler;
    private final GetPaymentMethodBreakdownQueryHandler getPaymentMethodBreakdownQueryHandler;
    
    // S-19 Handlers (Inventory Reports)
    private final GetInventoryStockQueryHandler getInventoryStockQueryHandler;
    private final GetExpiringItemsQueryHandler getExpiringItemsQueryHandler;
    private final GetInventoryMovementQueryHandler getInventoryMovementQueryHandler;
    private final GetWasteReportQueryHandler getWasteReportQueryHandler;
    private final GetCogsQueryHandler getCogsQueryHandler;
    
    // S-19 Handlers (HR Reports)
    private final GetAttendanceReportQueryHandler getAttendanceReportQueryHandler;
    private final GetPayrollQueryHandler getPayrollQueryHandler;
    private final GetHrCostQueryHandler getHrCostQueryHandler;
    private final GetViolationsQueryHandler getViolationsQueryHandler;
    private final GetCheckinHistoryQueryHandler getCheckinHistoryQueryHandler;
    
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
    @Operation(summary = "Báo cáo doanh thu tổng hợp", description = "Lấy dữ liệu doanh thu theo khoảng thời gian, hỗ trợ nhóm theo ngày/tuần/tháng.")
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
    @Operation(summary = "Heatmap doanh thu theo giờ", description = "Lấy dữ liệu doanh thu phân bổ theo từng khung giờ trong ngày (0-23h).")
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
    @Operation(summary = "Top sản phẩm bán chạy", description = "Danh sách N sản phẩm mang lại doanh thu cao nhất trong ngày.")
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
    @Operation(summary = "Chi tiết theo phương thức thanh toán", description = "Phân tích doanh thu theo các kênh: Tiền mặt, Chuyển khoản, MoMo, VietQR...")
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

    // ================== S-19 INVENTORY REPORTS ==================

    /**
     * Lấy báo cáo tồn kho hiện tại theo chi nhánh.
     * 
     * Status tự động tính:
     * - LOW: quantity <= reorder_point
     * - HIGH: quantity > max_stock
     * - NORMAL: else
     */
    @Operation(summary = "Báo cáo tồn kho hiện tại", description = "Lấy danh sách vật tư/sản phẩm còn trong kho, kèm mã màu cảnh báo (Thấp/Bình thường/Vượt định mức).")
    @GetMapping("/inventory")
    @PreAuthorize("hasAuthority('REPORT_INVENTORY')")
    public ResponseEntity<ApiResponse<Page<InventoryStockDto>>> getInventoryReport(
            @RequestParam(required = false) UUID branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        UUID effectiveBranchId = (branchId != null) ? branchId : TenantContext.getCurrentBranchId();
        log.info("GET /reports/inventory: branchId={}, effectiveBranchId={}, page={}, size={}", branchId, effectiveBranchId, page, size);
        
        GetInventoryStockQuery query = GetInventoryStockQuery.builder()
            .tenantId(TenantContext.getCurrentTenantId())
            .branchId(effectiveBranchId)
            .build();
        
        List<InventoryStockDto> list = getInventoryStockQueryHandler.handle(query);
        
        int start = Math.min((int) PageRequest.of(page, size).getOffset(), list.size());
        int end = Math.min((start + size), list.size());
        List<InventoryStockDto> content = list.subList(start, end);
        
        Page<InventoryStockDto> result = new PageImpl<>(content, PageRequest.of(page, size), list.size());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy danh sách items sắp hết hạn trong N ngày.
     * 
     * @param daysThreshold Số ngày (default: 30)
     */
    @Operation(summary = "Báo cáo hàng sắp hết hạn", description = "Liệt kê các lô hàng có ngày hết hạn trong phạm vi N ngày tới.")
    @GetMapping("/inventory/expiring")
    @PreAuthorize("hasAuthority('REPORT_INVENTORY')")
    public ResponseEntity<ApiResponse<Page<ExpiringItemsDto>>> getExpiringItems(
            @RequestParam(required = false) UUID branchId,
            @RequestParam(defaultValue = "30") int daysThreshold,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID effectiveBranchId = (branchId != null) ? branchId : TenantContext.getCurrentBranchId();
        log.info("GET /reports/inventory/expiring: branchId={}, effectiveBranchId={}, days={}, page={}, size={}", 
                branchId, effectiveBranchId, daysThreshold, page, size);
        
        GetExpiringItemsQuery query = GetExpiringItemsQuery.builder()
            .tenantId(TenantContext.getCurrentTenantId())
            .branchId(effectiveBranchId)
            .daysThreshold(daysThreshold)
            .build();
        
        List<ExpiringItemsDto> list = getExpiringItemsQueryHandler.handle(query);
        
        int start = Math.min((int) PageRequest.of(page, size).getOffset(), list.size());
        int end = Math.min((start + size), list.size());
        List<ExpiringItemsDto> content = list.subList(start, end);
        
        Page<ExpiringItemsDto> result = new PageImpl<>(content, PageRequest.of(page, size), list.size());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy báo cáo chuyển động kho (movement tracking).
     * Tracking: beginning balance + import - export + production = ending balance
     * 
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @param groupBy Cách nhóm: daily|weekly|monthly (default: daily)
     * @param page Trang (0-indexed, default: 0)
     * @param size Số items per page (default: 20)
     */
    @Operation(summary = "Báo cáo biến động kho", description = "Theo dõi lịch sử Nhập - Xuất - Tồn của từng mặt hàng theo thời gian.")
    @GetMapping("/inventory/movement")
    @PreAuthorize("hasAuthority('REPORT_INVENTORY')")
    public ResponseEntity<ApiResponse<Page<InventoryMovementDto>>> getInventoryMovement(
            @RequestParam(required = false) UUID branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "daily") String groupBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID effectiveBranchId = (branchId != null) ? branchId : TenantContext.getCurrentBranchId();
        log.info("GET /reports/inventory/movement: branchId={}, effectiveBranchId={}, from={}, to={}", 
                branchId, effectiveBranchId, startDate, endDate);
        
        GetInventoryMovementQuery query = GetInventoryMovementQuery.builder()
            .tenantId(TenantContext.getCurrentTenantId())
            .branchId(effectiveBranchId)
            .startDate(startDate)
            .endDate(endDate)
            .groupBy(groupBy)
            .page(page)
            .pageSize(size)
            .build();
        
        Page<InventoryMovementDto> result = getInventoryMovementQueryHandler.handle(query);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy báo cáo hao hụt (waste report).
     * Tính: waste % = totalWasteCost / (totalWasteCost + totalPurchaseCost)
     * Phân loại: GOOD (0-3%), MEDIUM (3-8%), POOR (>8%)
     * 
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @param page Trang (0-indexed, default: 0)
     * @param pageSize Số items per page (default: 50)
     */
    @Operation(summary = "Báo cáo hao hụt", description = "Thống kê lượng nguyên liệu mất mát, hư hỏng và tỷ lệ % hao hụt so với giá vốn.")
    @GetMapping("/inventory/waste")
    @PreAuthorize("hasAuthority('REPORT_INVENTORY')")
    public ResponseEntity<ApiResponse<List<WasteReportDto>>> getWasteReport(
            @RequestParam(required = false) UUID branchId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        
        UUID effectiveBranchId = (branchId != null) ? branchId : TenantContext.getCurrentBranchId();
        log.info("GET /reports/inventory/waste: branchId={}, effectiveBranchId={}, startDate={}, endDate={}", 
            branchId, effectiveBranchId, startDate, endDate);
        
        GetWasteReportQuery query = GetWasteReportQuery.builder()
            .tenantId(TenantContext.getCurrentTenantId())
            .branchId(branchId)
            .startDate(startDate)
            .endDate(endDate)
            .build();
        
        List<WasteReportDto> result = getWasteReportQueryHandler.handle(query);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy báo cáo COGS (Cost of Goods Sold).
     * Phương pháp: FIFO (First In First Out)
     * Tính: COGS per unit = batch.unit_cost (tại thời điểm import)
     * 
     * @param page Trang (0-indexed, default: 0)
     * @param pageSize Số items per page (default: 100)
     */
    @Operation(summary = "Báo cáo giá vốn (COGS)", description = "Tính toán giá vốn hàng bán dựa trên phương pháp FIFO và dữ liệu nhập kho thực tế.")
    @GetMapping("/inventory/cogs")
    @PreAuthorize("hasAuthority('REPORT_INVENTORY')")
    public ResponseEntity<ApiResponse<Page<CogsDto>>> getCogs(
            @RequestParam(required = false) UUID branchId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int pageSize) {
        
        UUID effectiveBranchId = (branchId != null) ? branchId : TenantContext.getCurrentBranchId();
        log.info("GET /reports/inventory/cogs: branchId={}, effectiveBranchId={}, startDate={}, endDate={}", 
            branchId, effectiveBranchId, startDate, endDate);
        
        GetCogsQuery query = GetCogsQuery.builder()
            .tenantId(TenantContext.getCurrentTenantId())
            .branchId(branchId)
            .startDate(startDate)
            .endDate(endDate)
            .page(page)
            .pageSize(pageSize)
            .build();
        
        Page<CogsDto> result = getCogsQueryHandler.handle(query);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ================== S-19 HR REPORTS ==================

    /**
     * Lấy báo cáo chấm công theo tháng.
     * 
     * @param month Tháng (YYYY-MM)
     */
    @Operation(summary = "Báo cáo chấm công tháng", description = "Tổng hợp ngày công, giờ làm việc thực tế và tỷ lệ chuyên cần của nhân sự.")
    @GetMapping("/hr/attendance")
    @PreAuthorize("hasAuthority('REPORT_HR')")
    public ResponseEntity<ApiResponse<Page<AttendanceReportDto>>> getAttendanceReport(
            @RequestParam(required = false) UUID branchId,
            @RequestParam(required = false) String month,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        UUID effectiveBranchId = (branchId != null) ? branchId : TenantContext.getCurrentBranchId();
        String effectiveMonth = (month != null) ? month : YearMonth.now().toString();
        
        log.info("GET /reports/hr/attendance: branchId={}, month={}, page={}, size={}", effectiveBranchId, effectiveMonth, page, size);
        
        GetAttendanceReportQuery query = GetAttendanceReportQuery.builder()
            .tenantId(TenantContext.getCurrentTenantId())
            .branchId(effectiveBranchId)
            .month(YearMonth.parse(effectiveMonth))
            .build();
        
        List<AttendanceReportDto> list = getAttendanceReportQueryHandler.handle(query);
        
        int start = Math.min((int) PageRequest.of(page, size).getOffset(), list.size());
        int end = Math.min((start + size), list.size());
        List<AttendanceReportDto> content = list.subList(start, end);
        
        Page<AttendanceReportDto> result = new PageImpl<>(content, PageRequest.of(page, size), list.size());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy báo cáo lương tháng.
     * 
     * 🔒 SECURITY: Staff chỉ xem được lương của mình
     * 
     * @param month Tháng (YYYY-MM)
     * @param staffId Staff ID (tùy chọn: không có = toàn bộ staff trong chi nhánh)
     */
    @Operation(summary = "Báo cáo bảng lương", description = "Chi tiết lương, thưởng, phụ cấp và các khoản khấu trừ cho nhân viên (có phân quyền bảo mật).")
    @GetMapping("/hr/payroll")
    @PreAuthorize("hasAuthority('REPORT_HR')")
    public ResponseEntity<ApiResponse<Page<PayrollReportDto>>> getPayrollReport(
            @RequestParam(required = false) UUID branchId,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) UUID staffId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        UUID effectiveBranchId = (branchId != null) ? branchId : TenantContext.getCurrentBranchId();
        String effectiveMonth = (month != null) ? month : YearMonth.now().toString();
        
        log.info("GET /reports/hr/payroll: branchId={}, month={}, staffId={}, page={}, size={}", 
                effectiveBranchId, effectiveMonth, staffId, page, size);
        
        // Logic vai trò người dùng để lọc báo cáo lương
        String currentUserRole = "STAFF";
        if (com.smartfnb.shared.SecurityUtils.hasRole("ROLE_OWNER")) {
            currentUserRole = "OWNER";
        } else if (com.smartfnb.shared.SecurityUtils.hasRole("ROLE_ADMIN")) {
            currentUserRole = "ADMIN";
        } else if (com.smartfnb.shared.SecurityUtils.hasRole("ROLE_BRANCH_MANAGER") || 
                   com.smartfnb.shared.SecurityUtils.hasRole("ROLE_MANAGER")) {
            currentUserRole = "MANAGER";
        }
        
        GetPayrollQuery query = GetPayrollQuery.builder()
            .tenantId(TenantContext.getCurrentTenantId())
            .branchId(effectiveBranchId)
            .month(YearMonth.parse(effectiveMonth))
            .staffId(staffId)
            .currentUserId(TenantContext.getCurrentUserId())
            .currentUserRole(currentUserRole)
            .build();
        
        List<PayrollReportDto> list = getPayrollQueryHandler.handle(query);
        
        int start = Math.min((int) PageRequest.of(page, size).getOffset(), list.size());
        int end = Math.min((start + size), list.size());
        List<PayrollReportDto> content = list.subList(start, end);
        
        Page<PayrollReportDto> result = new PageImpl<>(content, PageRequest.of(page, size), list.size());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy báo cáo chi phí nhân sự (aggregate).
     * Tính: chi phí = sum(lương + thưởng + phụ cấp - khấu trừ)
     */
    @Operation(summary = "Báo cáo tổng chi phí nhân sự", description = "Thống kê tổng ngân sách lương và quản lý chi phí nhân sự toàn chi nhánh.")
    @GetMapping("/hr/cost")
    @PreAuthorize("hasAuthority('REPORT_HR')")
    public ResponseEntity<ApiResponse<HrCostReportDto>> getHrCostReport(
            @RequestParam(required = false) UUID branchId,
            @RequestParam String month) {
        
        UUID effectiveBranchId = (branchId != null) ? branchId : TenantContext.getCurrentBranchId();
        YearMonth yearMonth = YearMonth.parse(month);
        log.info("GET /reports/hr/cost: branchId={}, effectiveBranchId={}, month={}", branchId, effectiveBranchId, yearMonth);
        
        GetHrCostQuery query = GetHrCostQuery.builder()
            .tenantId(TenantContext.getCurrentTenantId())
            .branchId(branchId)
            .month(yearMonth)
            .build();
        
        HrCostReportDto result = getHrCostQueryHandler.handle(query);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy báo cáo vi phạm (violations).
     * Loại: LATE (checkin > 15 min), NO_CHECKIN, ABSENT
     * 
     * @param page Trang (0-indexed, default: 0)
     * @param pageSize Số items per page (default: 50)
     */
    @Operation(summary = "Báo cáo vi phạm chấm công", description = "Danh sách các trường hợp đi muộn, về sớm hoặc vắng mặt không lý do.")
    @GetMapping("/hr/violations")
    @PreAuthorize("hasAuthority('REPORT_HR')")
    public ResponseEntity<ApiResponse<Page<ViolationReportDto>>> getViolationsReport(
            @RequestParam(required = false) UUID branchId,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String violationType,
            @RequestParam(required = false) UUID staffId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        
        UUID effectiveBranchId = (branchId != null) ? branchId : TenantContext.getCurrentBranchId();
        LocalDate effectiveStart = startDate;
        LocalDate effectiveEnd = endDate;
        
        if (month != null && startDate == null) {
            YearMonth ym = YearMonth.parse(month);
            effectiveStart = ym.atDay(1);
            effectiveEnd = ym.atEndOfMonth();
        }
        
        if (effectiveStart == null) effectiveStart = LocalDate.now().minusDays(30);
        if (effectiveEnd == null) effectiveEnd = LocalDate.now();
        
        log.info("GET /reports/hr/violations: branchId={}, effectiveBranchId={}, month={}, start={}, end={}", 
                branchId, effectiveBranchId, month, effectiveStart, effectiveEnd);
        
        GetViolationsQuery query = GetViolationsQuery.builder()
            .tenantId(TenantContext.getCurrentTenantId())
            .branchId(effectiveBranchId)
            .startDate(effectiveStart)
            .endDate(effectiveEnd)
            .violationType(violationType)
            .staffId(staffId)
            .page(page)
            .pageSize(pageSize)
            .build();
        
        Page<ViolationReportDto> result = getViolationsQueryHandler.handle(query);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy lịch sử checkin chi tiết.
     * Bao gồm: checkin time, checkout time, thực tế giờ làm, overtime
     * 
     * @param page Trang (0-indexed, default: 0)
     * @param pageSize Số items per page (default: 50)
     */
    @Operation(summary = "Lịch sử Check-in chi tiết", description = "Truy xuất log check-in/out chi tiết của nhân viên kèm tọa độ/hình ảnh (nếu có).")
    @GetMapping("/hr/checkin-history")
    @PreAuthorize("hasAuthority('REPORT_HR')")
    public ResponseEntity<ApiResponse<Page<CheckinHistoryDto>>> getCheckinHistory(
            @RequestParam UUID branchId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) UUID staffId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        
        log.info("GET /reports/hr/checkin-history: branchId={}", branchId);
        
        GetCheckinHistoryQuery query = GetCheckinHistoryQuery.builder()
            .tenantId(TenantContext.getCurrentTenantId())
            .branchId(branchId)
            .startDate(startDate)
            .endDate(endDate)
            .staffId(staffId)
            .page(page)
            .pageSize(pageSize)
            .build();
        
        Page<CheckinHistoryDto> result = getCheckinHistoryQueryHandler.handle(query);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
