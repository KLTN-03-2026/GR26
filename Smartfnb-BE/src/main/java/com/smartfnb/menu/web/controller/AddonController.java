package com.smartfnb.menu.web.controller;

import com.smartfnb.menu.application.command.AddonCommandHandler;
import com.smartfnb.menu.application.dto.AddonResponse;
import com.smartfnb.menu.application.dto.CreateAddonRequest;
import com.smartfnb.menu.application.dto.UpdateAddonRequest;
import com.smartfnb.menu.application.query.AddonQueryHandler;
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
 * REST Controller quản lý Addon/Topping trong thực đơn.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@RestController
@RequestMapping("/api/v1/menu/addons")
@RequiredArgsConstructor
@Tag(name = "Menu - Addon", description = "API quản lý Topping/Addon thực đơn")
public class AddonController {

    private final AddonCommandHandler addonCommandHandler;
    private final AddonQueryHandler addonQueryHandler;

    /**
     * Lấy danh sách tất cả addon, hỗ trợ phân trang.
     *
     * @param page số trang
     * @param size số bản ghi mỗi trang
     * @return danh sách addon
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'MENU_VIEW')")
    @Operation(summary = "Danh sách tất cả Addon/Topping")
    public ResponseEntity<ApiResponse<PageResponse<AddonResponse>>> listAddons(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageResponse<AddonResponse> result = addonQueryHandler.listAddons(page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy tất cả addon đang active — dùng cho POS khi khách chọn topping.
     *
     * @return danh sách addon active
     */
    @GetMapping("/active")
    @PreAuthorize("hasPermission(null, 'MENU_VIEW')")
    @Operation(summary = "Danh sách Addon/Topping đang kích hoạt (dùng cho POS)")
    public ResponseEntity<ApiResponse<List<AddonResponse>>> listActiveAddons() {
        List<AddonResponse> result = addonQueryHandler.listActiveAddons();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy chi tiết một addon.
     *
     * @param id ID addon
     * @return thông tin chi tiết addon
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'MENU_VIEW')")
    @Operation(summary = "Chi tiết Addon/Topping")
    public ResponseEntity<ApiResponse<AddonResponse>> getAddonById(@PathVariable UUID id) {
        AddonResponse result = addonQueryHandler.getAddonById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Tạo Addon/Topping mới.
     *
     * @param request thông tin addon cần tạo
     * @return thông tin addon vừa tạo
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'MENU_EDIT')")
    @Operation(summary = "Tạo Addon/Topping mới")
    public ResponseEntity<ApiResponse<AddonResponse>> createAddon(
            @Valid @RequestBody CreateAddonRequest request) {

        AddonResponse result = addonCommandHandler.createAddon(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    /**
     * Cập nhật Addon/Topping.
     *
     * @param id      ID addon cần cập nhật
     * @param request thông tin cập nhật
     * @return thông tin addon sau cập nhật
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'MENU_EDIT')")
    @Operation(summary = "Cập nhật Addon/Topping")
    public ResponseEntity<ApiResponse<AddonResponse>> updateAddon(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAddonRequest request) {

        AddonResponse result = addonCommandHandler.updateAddon(id, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Xóa Addon/Topping (soft delete).
     *
     * @param id ID addon cần xóa
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'MENU_EDIT')")
    @Operation(summary = "Xóa Addon/Topping (soft delete)")
    public ResponseEntity<Void> deleteAddon(@PathVariable UUID id) {
        addonCommandHandler.deleteAddon(id);
        return ResponseEntity.noContent().build();
    }
}
