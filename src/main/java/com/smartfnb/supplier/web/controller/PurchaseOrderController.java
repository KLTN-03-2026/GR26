package com.smartfnb.supplier.web.controller;

import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import com.smartfnb.supplier.application.command.*;
import com.smartfnb.supplier.application.query.GetPurchaseOrderDetailQueryHandler;
import com.smartfnb.supplier.application.query.GetPurchaseOrderDetailQueryHandler.PurchaseOrderDetailResult;
import com.smartfnb.supplier.application.query.GetPurchaseOrderListQueryHandler;
import com.smartfnb.supplier.application.query.GetPurchaseOrderListQueryHandler.PurchaseOrderSummaryResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller quản lý Đơn mua hàng (Purchase Order) — S-17.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET    /api/v1/purchase-orders              — Danh sách PO</li>
 *   <li>POST   /api/v1/purchase-orders              — Tạo PO (DRAFT)</li>
 *   <li>GET    /api/v1/purchase-orders/{id}         — Chi tiết PO</li>
 *   <li>POST   /api/v1/purchase-orders/{id}/send    — DRAFT → SENT</li>
 *   <li>POST   /api/v1/purchase-orders/{id}/receive — SENT → RECEIVED</li>
 *   <li>POST   /api/v1/purchase-orders/{id}/cancel  — Huỷ PO</li>
 * </ul>
 *
 * @author SmartF&B Team
 * @since 2026-04-07
 */
@RestController
@RequestMapping("/api/v1/purchase-orders")
@RequiredArgsConstructor
@Tag(name = "Purchase Orders", description = "Quản lý đơn mua hàng — S-17")
public class PurchaseOrderController {

    private final CreatePurchaseOrderCommandHandler createHandler;
    private final UpdatePurchaseOrderCommandHandler  updateHandler;
    private final SendPurchaseOrderCommandHandler    sendHandler;
    private final ReceivePurchaseOrderCommandHandler receiveHandler;
    private final CancelPurchaseOrderCommandHandler  cancelHandler;
    private final GetPurchaseOrderListQueryHandler   listHandler;
    private final GetPurchaseOrderDetailQueryHandler detailHandler;

    // ── DTOs ─────────────────────────────────────────────────────────

    public record CreatePurchaseOrderRequest(
            @NotNull UUID supplierId,
            String note,
            LocalDate expectedDate,
            @NotEmpty List<PurchaseOrderItemRequest> items
    ) {}

    public record PurchaseOrderItemRequest(
            @NotNull UUID itemId,
            @NotNull String itemName,
            String unit,
            @NotNull @Positive BigDecimal quantity,
            @NotNull @PositiveOrZero BigDecimal unitPrice,
            String note
    ) {}

    public record CancelRequest(String reason) {}

    // ── Endpoints ─────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','BRANCH_MANAGER')")
    @Operation(summary = "Danh sách đơn mua hàng")
    public ResponseEntity<ApiResponse<Page<PurchaseOrderSummaryResult>>> list(
            @RequestParam(required = false) UUID branchId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID tenantId  = TenantContext.getCurrentTenantId();
        UUID resolvedBranch = branchId != null ? branchId : TenantContext.getCurrentBranchId();

        Page<PurchaseOrderSummaryResult> result = listHandler.handle(
                tenantId, resolvedBranch, status, page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Tạo đơn mua hàng mới (DRAFT)")
    public ResponseEntity<ApiResponse<UUID>> create(@Valid @RequestBody CreatePurchaseOrderRequest request) {
        List<CreatePurchaseOrderCommand.PurchaseOrderItemCommand> items = request.items().stream()
                .map(i -> new CreatePurchaseOrderCommand.PurchaseOrderItemCommand(
                        i.itemId(), i.itemName(), i.unit(), i.quantity(), i.unitPrice(), i.note()))
                .toList();

        UUID id = createHandler.handle(new CreatePurchaseOrderCommand(
                TenantContext.getCurrentTenantId(),
                TenantContext.getCurrentBranchId(),
                request.supplierId(),
                request.note(),
                request.expectedDate(),
                TenantContext.getCurrentUserId(),
                items
        ));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(id));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','BRANCH_MANAGER')")
    @Operation(summary = "Chi tiết đơn mua hàng")
    public ResponseEntity<ApiResponse<PurchaseOrderDetailResult>> getDetail(@PathVariable UUID id) {
        PurchaseOrderDetailResult result = detailHandler.handle(id, TenantContext.getCurrentTenantId());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Cập nhật đơn mua hàng (chỉ khi DRAFT)")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreatePurchaseOrderRequest request) {
        List<UpdatePurchaseOrderCommand.PurchaseOrderItemCmd> items = request.items() == null ? null :
                request.items().stream()
                        .map(i -> new UpdatePurchaseOrderCommand.PurchaseOrderItemCmd(
                                i.itemId(), i.itemName(), i.unit(), i.quantity(), i.unitPrice(), i.note()))
                        .toList();
        updateHandler.handle(new UpdatePurchaseOrderCommand(
                id, TenantContext.getCurrentTenantId(),
                request.supplierId(), request.note(), request.expectedDate(), items
        ));
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/send")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Gửi đơn cho nhà cung cấp (DRAFT → SENT)")
    public ResponseEntity<ApiResponse<Void>> send(@PathVariable UUID id) {
        sendHandler.handle(new SendPurchaseOrderCommand(
                id, TenantContext.getCurrentTenantId(), TenantContext.getCurrentUserId()
        ));
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Xác nhận nhận hàng (SENT → RECEIVED) — tự động tạo StockBatch")
    public ResponseEntity<ApiResponse<Void>> receive(@PathVariable UUID id) {
        receiveHandler.handle(new ReceivePurchaseOrderCommand(
                id, TenantContext.getCurrentTenantId(), TenantContext.getCurrentUserId()
        ));
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Huỷ đơn mua hàng")
    public ResponseEntity<ApiResponse<Void>> cancel(
            @PathVariable UUID id,
            @RequestBody(required = false) CancelRequest request) {

        String reason = request != null ? request.reason() : null;
        cancelHandler.handle(new CancelPurchaseOrderCommand(
                id, TenantContext.getCurrentTenantId(), TenantContext.getCurrentUserId(), reason
        ));
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
