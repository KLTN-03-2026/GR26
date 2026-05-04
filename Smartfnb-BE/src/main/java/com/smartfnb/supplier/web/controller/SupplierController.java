package com.smartfnb.supplier.web.controller;

import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.web.ApiResponse;
import com.smartfnb.supplier.application.command.*;
import com.smartfnb.supplier.application.query.GetSupplierListQueryHandler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller quản lý Nhà cung cấp (Supplier) — S-17.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET    /api/v1/suppliers        — Danh sách (có filter tên)</li>
 *   <li>POST   /api/v1/suppliers        — Tạo mới</li>
 *   <li>PUT    /api/v1/suppliers/{id}   — Cập nhật</li>
 *   <li>DELETE /api/v1/suppliers/{id}   — Soft-delete (deactivate)</li>
 * </ul>
 *
 * @author vutq
 * @since 2026-04-07
 */
@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
@Tag(name = "Suppliers", description = "Quản lý nhà cung cấp — S-17")
public class SupplierController {

    private final CreateSupplierCommandHandler createHandler;
    private final UpdateSupplierCommandHandler updateHandler;
    private final GetSupplierListQueryHandler  listHandler;

    // ── DTOs ─────────────────────────────────────────────────────────

    public record CreateSupplierRequest(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 50)  String code,
            @Size(max = 100) String contactName,
            @Size(max = 20)  String phone,
            @Size(max = 100) String email,
            String address,
            @Size(max = 20)  String taxCode,
            String note
    ) {}

    public record UpdateSupplierRequest(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 50)  String code,
            @Size(max = 100) String contactName,
            @Size(max = 20)  String phone,
            @Size(max = 100) String email,
            String address,
            @Size(max = 20)  String taxCode,
            String note,
            boolean active
    ) {}

    // ── Endpoints ─────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','BRANCH_MANAGER')")
    @Operation(summary = "Danh sách nhà cung cấp")
    public ResponseEntity<ApiResponse<Page<GetSupplierListQueryHandler.SupplierResult>>> list(
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<GetSupplierListQueryHandler.SupplierResult> result = listHandler.handle(
                TenantContext.getCurrentTenantId(), name, page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Tạo nhà cung cấp mới")
    public ResponseEntity<ApiResponse<UUID>> create(@Valid @RequestBody CreateSupplierRequest request) {
        UUID id = createHandler.handle(new CreateSupplierCommand(
                TenantContext.getCurrentTenantId(),
                request.name(), request.code(), request.contactName(),
                request.phone(), request.email(), request.address(),
                request.taxCode(), request.note()
        ));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Cập nhật nhà cung cấp")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSupplierRequest request) {

        updateHandler.handle(new UpdateSupplierCommand(
                id,
                TenantContext.getCurrentTenantId(),
                request.name(), request.code(), request.contactName(),
                request.phone(), request.email(), request.address(),
                request.taxCode(), request.note(), request.active()
        ));
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    @Operation(summary = "Vô hiệu hoá nhà cung cấp (soft-delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        updateHandler.deactivate(id, TenantContext.getCurrentTenantId());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
