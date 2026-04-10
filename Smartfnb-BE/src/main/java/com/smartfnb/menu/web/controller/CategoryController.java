package com.smartfnb.menu.web.controller;

import com.smartfnb.menu.application.command.CategoryCommandHandler;
import com.smartfnb.menu.application.dto.CategoryResponse;
import com.smartfnb.menu.application.dto.CreateCategoryRequest;
import com.smartfnb.menu.application.dto.UpdateCategoryRequest;
import com.smartfnb.menu.application.query.CategoryQueryHandler;
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
 * REST Controller quản lý danh mục thực đơn.
 * Controller chỉ delegate — không chứa business logic.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@RestController
@RequestMapping("/api/v1/menu/categories")
@RequiredArgsConstructor
@Tag(name = "Menu - Category", description = "API quản lý danh mục thực đơn")
public class CategoryController {

    private final CategoryCommandHandler categoryCommandHandler;
    private final CategoryQueryHandler categoryQueryHandler;

    /**
     * Lấy danh sách danh mục, hỗ trợ tìm kiếm và phân trang.
     * Tất cả role đều có quyền xem.
     *
     * @param keyword từ khóa tìm kiếm (tùy chọn)
     * @param page    số trang (mặc định 0)
     * @param size    số bản ghi mỗi trang (mặc định 20)
     * @return danh sách danh mục
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'MENU_VIEW')")
    @Operation(summary = "Lấy danh sách danh mục thực đơn")
    public ResponseEntity<ApiResponse<PageResponse<CategoryResponse>>> listCategories(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageResponse<CategoryResponse> result = categoryQueryHandler.listCategories(keyword, page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy tất cả danh mục đang active — dùng cho dropdown tại POS.
     *
     * @return danh sách danh mục active
     */
    @GetMapping("/active")
    @PreAuthorize("hasPermission(null, 'MENU_VIEW')")
    @Operation(summary = "Lấy danh sách danh mục đang kích hoạt (dùng cho POS dropdown)")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> listActiveCategories() {
        List<CategoryResponse> result = categoryQueryHandler.listActiveCategories();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy chi tiết một danh mục.
     *
     * @param id ID danh mục
     * @return thông tin chi tiết danh mục
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'MENU_VIEW')")
    @Operation(summary = "Lấy chi tiết danh mục")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable UUID id) {
        CategoryResponse result = categoryQueryHandler.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Tạo danh mục mới.
     * Chỉ OWNER hoặc ADMIN có quyền.
     *
     * @param request thông tin danh mục cần tạo
     * @return thông tin danh mục vừa tạo
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'MENU_EDIT')")
    @Operation(summary = "Tạo danh mục mới")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request) {

        CategoryResponse result = categoryCommandHandler.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    /**
     * Cập nhật thông tin danh mục.
     * Nếu is_active = false → cascade deactivate tất cả món trong danh mục.
     *
     * @param id      ID danh mục cần cập nhật
     * @param request thông tin cập nhật
     * @return thông tin danh mục sau cập nhật
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'MENU_EDIT')")
    @Operation(summary = "Cập nhật danh mục")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCategoryRequest request) {

        CategoryResponse result = categoryCommandHandler.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Xóa danh mục (soft delete).
     *
     * @param id ID danh mục cần xóa
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'MENU_EDIT')")
    @Operation(summary = "Xóa danh mục (soft delete)")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        categoryCommandHandler.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
