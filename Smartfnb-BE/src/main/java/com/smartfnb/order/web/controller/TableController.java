package com.smartfnb.order.web.controller;

import com.smartfnb.order.application.command.TableCommandHandler;
import com.smartfnb.order.application.dto.*;
import com.smartfnb.order.application.query.TableQueryHandler;
import com.smartfnb.order.infrastructure.websocket.TableMapBroadcaster;
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
 * REST Controller quản lý bàn trong chi nhánh.
 * Hỗ trợ CRUD bàn (soft delete) và endpoint Drag & Drop batch update vị trí.
 * Sau mỗi thao tác thay đổi layout bàn, broadcast qua WebSocket.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@RestController
@RequestMapping("/api/v1/branches/{branchId}/tables")
@RequiredArgsConstructor
@Tag(name = "Table - Bàn", description = "API quản lý bàn và sơ đồ bàn")
public class TableController {

    private final TableCommandHandler tableCommandHandler;
    private final TableQueryHandler tableQueryHandler;
    private final TableMapBroadcaster tableMapBroadcaster;

    /**
     * Lấy toàn bộ sơ đồ bàn của chi nhánh.
     * Client dùng endpoint này để render sơ đồ ban đầu sau đó subscribe WebSocket.
     *
     * @param branchId ID chi nhánh
     * @return danh sách bàn với tọa độ và trạng thái
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'ORDER_VIEW')")
    @Operation(summary = "Sơ đồ bàn — toàn bộ bàn chưa xóa trong chi nhánh")
    public ResponseEntity<ApiResponse<List<TableResponse>>> listTables(
            @PathVariable UUID branchId) {

        List<TableResponse> result = tableQueryHandler.listTables(branchId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Lấy chi tiết một bàn.
     *
     * @param branchId ID chi nhánh
     * @param tableId  ID bàn
     * @return thông tin bàn
     */
    @GetMapping("/{tableId}")
    @PreAuthorize("hasPermission(null, 'ORDER_VIEW')")
    @Operation(summary = "Chi tiết bàn")
    public ResponseEntity<ApiResponse<TableResponse>> getTableById(
            @PathVariable UUID branchId,
            @PathVariable UUID tableId) {

        TableResponse result = tableQueryHandler.getTableById(tableId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Đếm số bàn đang có khách (OCCUPIED) trong chi nhánh.
     * Dùng cho dashboard thống kê nhanh.
     *
     * @param branchId ID chi nhánh
     * @return số bàn đang có khách
     */
    @GetMapping("/stats/occupied-count")
    @PreAuthorize("hasPermission(null, 'ORDER_VIEW')")
    @Operation(summary = "Số bàn đang có khách")
    public ResponseEntity<ApiResponse<Long>> countOccupied(@PathVariable UUID branchId) {
        long count = tableQueryHandler.countOccupiedTables(branchId);
        return ResponseEntity.ok(ApiResponse.ok(count));
    }

    /**
     * Tạo bàn mới trong chi nhánh.
     *
     * @param branchId ID chi nhánh
     * @param request  thông tin bàn
     * @return thông tin bàn vừa tạo
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'BRANCH_EDIT')")
    @Operation(summary = "Tạo bàn mới")
    public ResponseEntity<ApiResponse<TableResponse>> createTable(
            @PathVariable UUID branchId,
            @Valid @RequestBody CreateTableRequest request) {

        TableResponse result = tableCommandHandler.createTable(branchId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    /**
     * Cập nhật thông tin bàn.
     *
     * @param branchId ID chi nhánh
     * @param tableId  ID bàn cần sửa
     * @param request  thông tin cập nhật
     * @return thông tin bàn sau cập nhật
     */
    @PutMapping("/{tableId}")
    @PreAuthorize("hasPermission(null, 'BRANCH_EDIT')")
    @Operation(summary = "Cập nhật thông tin bàn")
    public ResponseEntity<ApiResponse<TableResponse>> updateTable(
            @PathVariable UUID branchId,
            @PathVariable UUID tableId,
            @Valid @RequestBody UpdateTableRequest request) {

        TableResponse result = tableCommandHandler.updateTable(branchId, tableId, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Xóa bàn (soft delete).
     * Không xóa được bàn đang OCCUPIED (có khách).
     *
     * @param branchId ID chi nhánh
     * @param tableId  ID bàn cần xóa
     * @return 204 No Content
     */
    @DeleteMapping("/{tableId}")
    @PreAuthorize("hasPermission(null, 'BRANCH_EDIT')")
    @Operation(summary = "Xóa bàn (soft delete)")
    public ResponseEntity<Void> deleteTable(
            @PathVariable UUID branchId,
            @PathVariable UUID tableId) {

        tableCommandHandler.deleteTable(branchId, tableId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Batch update vị trí bàn sau khi nhân viên Drag & Drop trên sơ đồ.
     * Sau khi lưu xong, broadcast danh sách bàn mới qua WebSocket /topic/tables/{branchId}
     * để tất cả màn hình khác cùng chi nhánh cập nhật sơ đồ realtime.
     *
     * @param branchId ID chi nhánh
     * @param request  danh sách (tableId, positionX, positionY) mới
     * @return 200 OK sau khi lưu và broadcast thành công
     */
    @PutMapping("/positions")
    @PreAuthorize("hasPermission(null, 'BRANCH_EDIT')")
    @Operation(summary = "Batch update vị trí bàn (Drag & Drop) — broadcast WebSocket")
    public ResponseEntity<ApiResponse<Void>> batchUpdatePositions(
            @PathVariable UUID branchId,
            @Valid @RequestBody UpdateTablePositionsRequest request) {

        // 1. Lưu vị trí mới vào DB
        tableCommandHandler.batchUpdatePositions(branchId, request);

        // 2. Lấy danh sách bàn mới nhất sau khi update
        List<TableResponse> updatedTables = tableQueryHandler.listTables(branchId);

        // 3. Broadcast qua WebSocket để tất cả client cùng chi nhánh cập nhật realtime
        tableMapBroadcaster.broadcastTableMap(branchId, updatedTables);

        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
