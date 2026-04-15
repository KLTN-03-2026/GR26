package com.smartfnb.inventory.web.controller;

import com.smartfnb.inventory.application.command.ProduceItemCommand;
import com.smartfnb.inventory.application.command.ProduceItemCommandHandler;
import com.smartfnb.inventory.web.controller.dto.ProduceItemRequest;
import com.smartfnb.shared.SecurityUtils;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller xử lý các nghiệp vụ sản xuất (Production) trong kho.
 * 
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@RestController
@RequestMapping("/api/v1/inventory/production")
@RequiredArgsConstructor
@Tag(name = "Inventory - Production", description = "API quản lý sản xuất thành phẩm/bán thành phẩm")
public class ProductionController {

    private final ProduceItemCommandHandler produceHandler;

    /**
     * API Thực hiện sản xuất một mặt hàng (thành phẩm hoặc bán thành phẩm).
     * Client truyền vào danh sách nguyên liệu tiêu thụ thực tế để hệ thống khấu trừ kho.
     * Tự động tăng tồn kho mặt hàng đầu ra sau khi sản xuất thành công.
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'INVENTORY_MANAGE')")
    @Operation(summary = "Thực hiện sản xuất (Production flow)")
    public ResponseEntity<ApiResponse<UUID>> produce(@RequestBody @Valid ProduceItemRequest request) {
        
        UUID producedBy = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy thông tin người dùng hiện tại trong SecurityContext."));

        ProduceItemCommand command = new ProduceItemCommand(
                TenantContext.requireCurrentTenantId(),
                request.branchId(),
                request.outputItemId(),
                request.quantity(),
                producedBy,
                request.ingredients().stream()
                        .map(i -> new ProduceItemCommand.IngredientItem(i.itemId(), i.quantity()))
                        .collect(Collectors.toList()),
                request.note()
        );
        
        UUID batchId = produceHandler.handle(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(batchId));
    }
}
