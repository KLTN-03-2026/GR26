package com.smartfnb.menu.web.controller;

import com.smartfnb.menu.application.command.MenuItemCommandHandler;
import com.smartfnb.menu.application.dto.BranchItemResponse;
import com.smartfnb.menu.application.dto.SetBranchItemPriceRequest;
import com.smartfnb.menu.application.query.MenuItemQueryHandler;
import com.smartfnb.shared.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller quản lý giá bán và trạng thái của món ăn theo chi nhánh.
 * Cho phép Owner/Admin cài giá riêng tại từng cơ sở.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@RestController
@RequestMapping("/api/v1/menu/branches/{branchId}/items")
@RequiredArgsConstructor
@Tag(name = "Menu - BranchItem", description = "API thiết lập giá món ăn theo chi nhánh")
public class BranchItemController {

    private final MenuItemCommandHandler menuItemCommandHandler;
    private final MenuItemQueryHandler menuItemQueryHandler;

    /**
     * Lấy thông tin giá của một món ăn tại chi nhánh cụ thể.
     * Trả về effective price (branch_price nếu có, ngược lại dùng base_price).
     *
     * @param branchId ID chi nhánh
     * @param itemId   ID món ăn
     * @return thông tin giá kết hợp
     */
    @GetMapping("/{itemId}")
    @PreAuthorize("hasPermission(null, 'MENU_VIEW')")
    @Operation(summary = "Lấy giá món ăn tại chi nhánh")
    public ResponseEntity<ApiResponse<BranchItemResponse>> getBranchItemPrice(
            @PathVariable UUID branchId,
            @PathVariable UUID itemId) {

        BranchItemResponse result = menuItemQueryHandler.getBranchItemPrice(branchId, itemId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Thiết lập giá bán riêng và trạng thái phục vụ cho một món tại chi nhánh.
     * Dùng upsert: cập nhật nếu đã có cài đặt, tạo mới nếu chưa có.
     * branchPrice = null → xóa giá riêng, quay về dùng base_price.
     *
     * @param branchId ID chi nhánh
     * @param itemId   ID món ăn
     * @param request  thông tin giá và trạng thái mới
     * @return 200 OK sau khi thiết lập thành công
     */
    @PutMapping("/{itemId}/price")
    @PreAuthorize("hasPermission(null, 'MENU_EDIT')")
    @Operation(summary = "Thiết lập giá riêng và trạng thái phục vụ tại chi nhánh")
    public ResponseEntity<ApiResponse<Void>> setBranchItemPrice(
            @PathVariable UUID branchId,
            @PathVariable UUID itemId,
            @Valid @RequestBody SetBranchItemPriceRequest request) {

        menuItemCommandHandler.setBranchItemPrice(branchId, itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
