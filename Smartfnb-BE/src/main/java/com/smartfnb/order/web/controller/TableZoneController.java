package com.smartfnb.order.web.controller;

import com.smartfnb.order.application.command.TableCommandHandler;
import com.smartfnb.order.application.dto.CreateTableZoneRequest;
import com.smartfnb.order.application.dto.TableZoneResponse;
import com.smartfnb.order.application.dto.UpdateTableZoneRequest;
import com.smartfnb.order.application.query.TableQueryHandler;
import com.smartfnb.shared.web.ApiResponse;
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
 * REST Controller quản lý khu vực bàn (Table Zone).
 * Scope theo branchId trong URL path.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@RestController
@RequestMapping("/api/v1/branches/{branchId}/zones")
@RequiredArgsConstructor
@Tag(name = "Table - Zone", description = "API quản lý khu vực bàn (Tầng 1, Sân thượng...)")
public class TableZoneController {

    private final TableCommandHandler tableCommandHandler;
    private final TableQueryHandler tableQueryHandler;

    /**
     * Lấy danh sách khu vực bàn trong chi nhánh.
     * Sắp xếp theo tầng và tên.
     *
     * @param branchId ID chi nhánh
     * @return danh sách zone
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'ORDER_VIEW')")
    @Operation(summary = "Danh sách khu vực bàn trong chi nhánh")
    public ResponseEntity<ApiResponse<List<TableZoneResponse>>> listZones(
            @PathVariable UUID branchId) {

        List<TableZoneResponse> result = tableQueryHandler.listZones(branchId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy chi tiết một khu vực bàn.
     *
     * @param branchId ID chi nhánh
     * @param zoneId   ID zone
     * @return thông tin zone
     */
    @GetMapping("/{zoneId}")
    @PreAuthorize("hasPermission(null, 'ORDER_VIEW')")
    @Operation(summary = "Chi tiết khu vực bàn")
    public ResponseEntity<ApiResponse<TableZoneResponse>> getZoneById(
            @PathVariable UUID branchId,
            @PathVariable UUID zoneId) {

        TableZoneResponse result = tableQueryHandler.getZoneById(branchId, zoneId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Tạo khu vực bàn mới.
     * Chỉ BRANCH_MANAGER, ADMIN, OWNER có quyền.
     *
     * @param branchId ID chi nhánh
     * @param request  thông tin zone mới
     * @return thông tin zone vừa tạo
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'BRANCH_EDIT')")
    @Operation(summary = "Tạo khu vực bàn mới")
    public ResponseEntity<ApiResponse<TableZoneResponse>> createZone(
            @PathVariable UUID branchId,
            @Valid @RequestBody CreateTableZoneRequest request) {

        TableZoneResponse result = tableCommandHandler.createZone(branchId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    /**
     * Cập nhật khu vực bàn.
     *
     * @param branchId ID chi nhánh
     * @param zoneId   ID zone cần sửa
     * @param request  thông tin cập nhật
     * @return thông tin zone sau cập nhật
     */
    @PutMapping("/{zoneId}")
    @PreAuthorize("hasPermission(null, 'BRANCH_EDIT')")
    @Operation(summary = "Cập nhật khu vực bàn")
    public ResponseEntity<ApiResponse<TableZoneResponse>> updateZone(
            @PathVariable UUID branchId,
            @PathVariable UUID zoneId,
            @Valid @RequestBody UpdateTableZoneRequest request) {

        TableZoneResponse result = tableCommandHandler.updateZone(branchId, zoneId, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Xóa khu vực bàn.
     * Chỉ xóa được khi zone không còn bàn nào.
     *
     * @param branchId ID chi nhánh
     * @param zoneId   ID zone cần xóa
     * @return 204 No Content
     */
    @DeleteMapping("/{zoneId}")
    @PreAuthorize("hasPermission(null, 'BRANCH_EDIT')")
    @Operation(summary = "Xóa khu vực bàn (chỉ xóa được khi không còn bàn)")
    public ResponseEntity<Void> deleteZone(
            @PathVariable UUID branchId,
            @PathVariable UUID zoneId) {

        tableCommandHandler.deleteZone(branchId, zoneId);
        return ResponseEntity.noContent().build();
    }
}
