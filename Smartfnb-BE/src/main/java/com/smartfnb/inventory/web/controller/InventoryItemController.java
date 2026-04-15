package com.smartfnb.inventory.web.controller;

import com.smartfnb.inventory.application.command.*;
import com.smartfnb.inventory.application.dto.*;
import com.smartfnb.inventory.application.query.InventoryItemQueryHandler;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import com.smartfnb.shared.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller cung cấp các API quản lý danh mục nguyên liệu và bán thành phẩm.
 * 
 * Tài liệu API này hỗ trợ các thao tác CRUD cơ bản:
 * - Truy vấn danh sách và chi tiết.
 * - Tạo mới, cập nhật thông tin.
 * - Kích hoạt hoặc tạm ngưng nguyên liệu.
 * 
 * Bảo mật: Áp dụng phân quyền dựa trên INVENTORY_VIEW và INVENTORY_MANAGE.
 * Đa thuê: TenantId được tự động lấy từ SecurityContext (JWT token).
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@RestController
@RequestMapping("/api/v1/inventory/items")
@RequiredArgsConstructor
@Tag(name = "Inventory - Item", description = "API quản lý danh mục nguyên liệu")
public class InventoryItemController {

    private final CreateInventoryItemCommandHandler createHandler;
    private final UpdateInventoryItemCommandHandler updateHandler;
    private final ToggleInventoryItemCommandHandler toggleHandler;
    private final InventoryItemQueryHandler queryHandler;

    /**
     * API Lấy danh sách nguyên liệu có phân trang.
     * Mặc định sắp xếp theo tên A-Z.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'INVENTORY_VIEW')")
    @Operation(summary = "Danh sách nguyên liệu (phân trang)")
    public ResponseEntity<ApiResponse<PageResponse<InventoryItemResponse>>> listItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        PageResponse<InventoryItemResponse> result = queryHandler.listItems(page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * API Lấy chi tiết thông tin một nguyên liệu/bán thành phẩm.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'INVENTORY_VIEW')")
    @Operation(summary = "Chi tiết nguyên liệu")
    public ResponseEntity<ApiResponse<InventoryItemResponse>> getItemDetail(@PathVariable UUID id) {
        InventoryItemResponse result = queryHandler.getItemDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * API Tạo mới một nguyên liệu hoặc bán thành phẩm.
     * Tự động gán TenantId từ người dùng hiện tại vào lệnh thực thi.
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'INVENTORY_MANAGE')")
    @Operation(summary = "Tạo mới nguyên liệu")
    public ResponseEntity<ApiResponse<UUID>> createItem(@RequestBody @Valid CreateInventoryItemRequest request) {
        CreateInventoryItemCommand command = new CreateInventoryItemCommand(
                TenantContext.requireCurrentTenantId(),
                request.name(),
                request.sku(),
                request.type(),
                request.unit(),
                request.categoryId()
        );
        
        UUID id = createHandler.handle(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(id));
    }

    /**
     * API Cập nhật thông tin chi tiết một nguyên liệu hiện có.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'INVENTORY_MANAGE')")
    @Operation(summary = "Cập nhật thông tin nguyên liệu")
    public ResponseEntity<ApiResponse<Void>> updateItem(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateInventoryItemRequest request) {
        
        UpdateInventoryItemCommand command = new UpdateInventoryItemCommand(
                id,
                TenantContext.requireCurrentTenantId(),
                request.name(),
                request.sku(),
                request.unit(),
                request.categoryId()
        );
        
        updateHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /**
     * API Bật/Tắt trạng thái hoạt động (Active/Inactive) của nguyên liệu.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasPermission(null, 'INVENTORY_MANAGE')")
    @Operation(summary = "Bật/Tắt trạng thái hoạt động của nguyên liệu")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(@PathVariable UUID id) {
        ToggleInventoryItemCommand command = new ToggleInventoryItemCommand(
                id,
                TenantContext.requireCurrentTenantId()
        );
        
        toggleHandler.handle(command);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
