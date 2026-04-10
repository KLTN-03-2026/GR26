package com.smartfnb.inventory.web.controller;

import com.smartfnb.inventory.application.command.*;
import com.smartfnb.inventory.application.query.GetInventoryQuery;
import com.smartfnb.inventory.application.query.GetInventoryQueryHandler;
import com.smartfnb.inventory.application.query.result.InventoryBalanceResult;
import com.smartfnb.inventory.web.controller.dto.*;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import com.smartfnb.shared.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller cho Module Inventory.
 * Cung cấp các API:
 * <ul>
 *   <li>POST /api/v1/inventory/import   — S-13: Nhập kho</li>
 *   <li>POST /api/v1/inventory/adjust   — S-14: Điều chỉnh kho thủ công</li>
 *   <li>POST /api/v1/inventory/waste    — S-14: Ghi hao hụt</li>
 *   <li>GET  /api/v1/inventory          — S-14: Xem tồn kho theo chi nhánh</li>
 * </ul>
 *
 * <p>Quy tắc: Controller chỉ delegate, không chứa business logic.</p>
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Inventory", description = "Quản lý kho nguyên liệu — Nhập kho, điều chỉnh, hao hụt, xem tồn kho")
public class InventoryController {

    private final ImportStockCommandHandler   importStockCommandHandler;
    private final AdjustStockCommandHandler   adjustStockCommandHandler;
    private final WasteRecordCommandHandler   wasteRecordCommandHandler;
    private final GetInventoryQueryHandler    getInventoryQueryHandler;

    // ============================== S-13: NHẬP KHO ==============================

    /**
     * Nhập kho nguyên liệu — tạo StockBatch mới và cập nhật tồn kho.
     * Chỉ OWNER, ADMIN, BRANCH_MANAGER mới có quyền INVENTORY_IMPORT.
     *
     * @param request thông tin nhập kho (itemId, quantity, costPerUnit, ...)
     * @return UUID của StockBatch vừa tạo
     */
    @PostMapping("/import")
    @PreAuthorize("hasAuthority('INVENTORY_IMPORT')")
    @Operation(summary = "Nhập kho nguyên liệu", description = "Tạo lô hàng nhập kho mới (StockBatch) và cập nhật tồn kho. Yêu cầu quyền INVENTORY_IMPORT.")
    public ResponseEntity<ApiResponse<UUID>> importStock(
            @Valid @RequestBody ImportStockRequest request) {

        log.info("API nhập kho: itemId={}, qty={}", request.itemId(), request.quantity());

        // Map Request → Command (tenantId, branchId, userId từ JWT — không từ body)
        ImportStockCommand command = new ImportStockCommand(
            TenantContext.requireCurrentTenantId(),
            TenantContext.getCurrentBranchId(),
            TenantContext.getCurrentUserId(),
            request.itemId(),
            request.supplierId(),
            request.quantity(),
            request.costPerUnit(),
            request.expiresAt(),
            request.note()
        );

        UUID batchId = importStockCommandHandler.handle(command);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(batchId));
    }

    // ============================== S-14: ĐIỀU CHỈNH KHO ==============================

    /**
     * Điều chỉnh tồn kho thủ công — set giá trị tuyệt đối mới.
     * Bắt buộc cung cấp lý do điều chỉnh. Ghi audit_log tự động.
     * Chỉ OWNER, ADMIN mới có quyền INVENTORY_ADJUST.
     *
     * @param request thông tin điều chỉnh (itemId, newQuantity, reason)
     * @return 204 No Content nếu thành công
     */
    @PostMapping("/adjust")
    @PreAuthorize("hasAuthority('INVENTORY_ADJUST')")
    @Operation(summary = "Điều chỉnh kho thủ công", description = "Đặt lại số lượng tồn kho theo giá trị mới. Bắt buộc có lý do — tự động ghi audit log. Yêu cầu quyền INVENTORY_ADJUST.")
    public ResponseEntity<ApiResponse<Void>> adjustStock(
            @Valid @RequestBody AdjustStockRequest request) {

        log.info("API điều chỉnh kho: itemId={}, newQty={}", request.itemId(), request.newQuantity());

        AdjustStockCommand command = new AdjustStockCommand(
            TenantContext.requireCurrentTenantId(),
            TenantContext.getCurrentBranchId(),
            TenantContext.getCurrentUserId(),
            request.itemId(),
            request.newQuantity(),
            request.reason()
        );

        adjustStockCommandHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /**
     * Ghi nhận hao hụt nguyên liệu (waste, expire, spill...).
     * Giảm tồn kho và ghi audit_log.
     * Chỉ OWNER, ADMIN, BRANCH_MANAGER mới có quyền INVENTORY_WASTE.
     *
     * @param request thông tin hao hụt (itemId, quantity, reason)
     * @return 200 OK nếu thành công
     */
    @PostMapping("/waste")
    @PreAuthorize("hasAuthority('INVENTORY_WASTE')")
    @Operation(summary = "Ghi nhận hao hụt nguyên liệu", description = "Ghi nhận số lượng nguyên liệu bị hao hụt (hỏng, rò rỉ, hết hạn). Tự động giảm tồn kho và ghi audit log. Yêu cầu quyền INVENTORY_WASTE.")
    public ResponseEntity<ApiResponse<Void>> recordWaste(
            @Valid @RequestBody WasteRecordRequest request) {

        log.info("API ghi hao hụt: itemId={}, qty={}", request.itemId(), request.quantity());

        WasteRecordCommand command = new WasteRecordCommand(
            TenantContext.requireCurrentTenantId(),
            TenantContext.getCurrentBranchId(),
            TenantContext.getCurrentUserId(),
            request.itemId(),
            request.quantity(),
            request.reason()
        );

        wasteRecordCommandHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ============================== S-14: XEM TỒN KHO ==============================

    /**
     * Lấy danh sách tồn kho nguyên liệu theo chi nhánh, có phân trang.
     * OWNER có thể xem toàn tenant (branchId tự động null nếu OWNER).
     * Các role khác chỉ xem chi nhánh đang làm việc (branchId từ JWT).
     *
     * @param page số trang (mặc định 0)
     * @param size kích thước trang (mặc định 20, tối đa 100)
     * @return danh sách tồn kho phân trang
     */
    @GetMapping
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    @Operation(summary = "Xem tồn kho theo chi nhánh", description = "Lấy danh sách tồn kho nguyên liệu. OWNER xem toàn tenant, các role khác chỉ xem chi nhánh đang làm việc. Trả về isLowStock=true nếu dưới ngưỡng cảnh báo.")
    public ResponseEntity<ApiResponse<PageResponse<InventoryBalanceResponse>>> getInventory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.debug("API xem tồn kho: page={}, size={}", page, size);

        // Phân quyền: OWNER xem tất cả (branchId=null), non-OWNER chỉ xem branch của mình
        UUID tenantId = TenantContext.requireCurrentTenantId();
        String role   = TenantContext.getCurrentRole();
        UUID branchId = isOwner(role) ? null : TenantContext.getCurrentBranchId();

        GetInventoryQuery query = new GetInventoryQuery(tenantId, branchId, page, size);

        List<InventoryBalanceResult> results = getInventoryQueryHandler.handle(query);
        long total = getInventoryQueryHandler.count(query);

        List<InventoryBalanceResponse> responses = results.stream()
            .map(InventoryBalanceResponse::from)
            .toList();

        int safeSize = Math.min(size, 100);
        PageResponse<InventoryBalanceResponse> pageResponse =
            PageResponse.of(responses, page, safeSize, total);

        return ResponseEntity.ok(ApiResponse.ok(pageResponse));
    }

    /**
     * Kiểm tra role có phải OWNER hoặc SUPER_ADMIN không.
     *
     * @param role tên role
     * @return true nếu là OWNER hoặc SUPER_ADMIN
     */
    private boolean isOwner(String role) {
        return role != null && (role.equals("OWNER") || role.equals("SUPER_ADMIN"));
    }
}
