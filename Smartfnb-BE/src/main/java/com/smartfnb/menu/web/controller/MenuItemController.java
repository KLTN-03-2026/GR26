package com.smartfnb.menu.web.controller;

import com.smartfnb.menu.application.command.MenuItemCommandHandler;
import com.smartfnb.menu.application.dto.*;
import com.smartfnb.menu.application.query.MenuItemQueryHandler;
import com.smartfnb.menu.application.query.RecipeQueryHandler;
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

import java.util.List;
import java.util.UUID;

/**
 * REST Controller quản lý món ăn trong thực đơn.
 * Hỗ trợ tìm kiếm pg_trgm, soft delete và xem công thức chế biến.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@RestController
@RequestMapping("/api/v1/menu/items")
@RequiredArgsConstructor
@Tag(name = "Menu - MenuItem", description = "API quản lý món ăn trong thực đơn")
public class MenuItemController {

    private final MenuItemCommandHandler menuItemCommandHandler;
    private final MenuItemQueryHandler menuItemQueryHandler;
    private final RecipeQueryHandler recipeQueryHandler;

    /**
     * Lấy danh sách món ăn — hỗ trợ tìm kiếm fuzzy bằng pg_trgm.
     *
     * @param keyword từ khóa tìm kiếm (tùy chọn — dùng pg_trgm similarity)
     * @param page    số trang (mặc định 0)
     * @param size    số bản ghi mỗi trang (mặc định 20)
     * @return danh sách món ăn
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'MENU_VIEW')")
    @Operation(summary = "Danh sách món ăn (hỗ trợ tìm kiếm pg_trgm)")
    public ResponseEntity<ApiResponse<PageResponse<MenuItemResponse>>> listMenuItems(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageResponse<MenuItemResponse> result = menuItemQueryHandler.listMenuItems(keyword, page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy tất cả món đang active — dùng cho POS dropdown picker.
     *
     * @return danh sách món ăn active
     */
    @GetMapping("/active")
    @PreAuthorize("hasPermission(null, 'MENU_VIEW')")
    @Operation(summary = "Danh sách món ăn đang kích hoạt (dùng cho POS)")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> listActiveItems() {
        List<MenuItemResponse> result = menuItemQueryHandler.listActiveMenuItems();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy chi tiết một món ăn.
     *
     * @param id ID món ăn
     * @return thông tin chi tiết món ăn
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'MENU_VIEW')")
    @Operation(summary = "Chi tiết món ăn")
    public ResponseEntity<ApiResponse<MenuItemResponse>> getMenuItemById(@PathVariable UUID id) {
        MenuItemResponse result = menuItemQueryHandler.getMenuItemById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy công thức chế biến của một món ăn.
     *
     * @param id ID món ăn
     * @return danh sách nguyên liệu trong công thức
     */
    @GetMapping("/{id}/recipe")
    @PreAuthorize("hasPermission(null, 'MENU_VIEW')")
    @Operation(summary = "Công thức chế biến của món ăn")
    public ResponseEntity<ApiResponse<List<RecipeResponse>>> getRecipeByItem(@PathVariable UUID id) {
        List<RecipeResponse> result = recipeQueryHandler.getRecipesByItem(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Tạo món ăn mới trong thực đơn.
     *
     * @param request thông tin món ăn cần tạo
     * @return thông tin món ăn vừa tạo
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'MENU_EDIT')")
    @Operation(summary = "Tạo món ăn mới")
    public ResponseEntity<ApiResponse<MenuItemResponse>> createMenuItem(
            @Valid @RequestBody CreateMenuItemRequest request) {

        MenuItemResponse result = menuItemCommandHandler.createMenuItem(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    /**
     * Cập nhật thông tin món ăn.
     *
     * @param id      ID món ăn cần cập nhật
     * @param request thông tin cập nhật
     * @return thông tin món ăn sau cập nhật
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'MENU_EDIT')")
    @Operation(summary = "Cập nhật món ăn")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateMenuItem(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMenuItemRequest request) {

        MenuItemResponse result = menuItemCommandHandler.updateMenuItem(id, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Xóa món ăn (soft delete — giữ lại dữ liệu lịch sử đơn hàng).
     *
     * @param id ID món ăn cần xóa
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'MENU_EDIT')")
    @Operation(summary = "Xóa món ăn (soft delete)")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable UUID id) {
        menuItemCommandHandler.deleteMenuItem(id);
        return ResponseEntity.noContent().build();
    }
}
