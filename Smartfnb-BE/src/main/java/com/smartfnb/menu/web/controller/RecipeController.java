package com.smartfnb.menu.web.controller;

import com.smartfnb.menu.application.command.RecipeCommandHandler;
import com.smartfnb.menu.application.dto.CreateRecipeRequest;
import com.smartfnb.menu.application.dto.RecipeResponse;
import com.smartfnb.menu.application.dto.UpdateRecipeRequest;
import com.smartfnb.shared.web.ApiResponse;
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
 * REST Controller quản lý công thức chế biến (Recipe).
 * Định nghĩa nguyên liệu và định lượng cần dùng cho từng món ăn.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@RestController
@RequestMapping("/api/v1/menu/recipes")
@RequiredArgsConstructor
@Tag(name = "Menu - Recipe", description = "API quản lý công thức chế biến")
public class RecipeController {

    private final RecipeCommandHandler recipeCommandHandler;

    /**
     * Thêm một dòng nguyên liệu vào công thức món ăn.
     *
     * @param request thông tin nguyên liệu và định lượng
     * @return thông tin dòng công thức vừa thêm
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'MENU_EDIT')")
    @Operation(summary = "Thêm nguyên liệu vào công thức chế biến")
    public ResponseEntity<ApiResponse<RecipeResponse>> createRecipe(
            @Valid @RequestBody CreateRecipeRequest request) {

        RecipeResponse result = recipeCommandHandler.createRecipe(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    /**
     * Cập nhật định lượng nguyên liệu trong công thức.
     *
     * @param id      ID dòng công thức
     * @param request thông tin cập nhật (quantity và unit)
     * @return thông tin công thức sau cập nhật
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'MENU_EDIT')")
    @Operation(summary = "Cập nhật định lượng nguyên liệu trong công thức")
    public ResponseEntity<ApiResponse<RecipeResponse>> updateRecipe(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRecipeRequest request) {

        RecipeResponse result = recipeCommandHandler.updateRecipe(id, request.quantity(), request.unit());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Xóa một dòng nguyên liệu khỏi công thức.
     *
     * @param id ID dòng công thức cần xóa
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'MENU_EDIT')")
    @Operation(summary = "Xóa nguyên liệu khỏi công thức")
    public ResponseEntity<Void> deleteRecipe(@PathVariable UUID id) {
        recipeCommandHandler.deleteRecipe(id);
        return ResponseEntity.noContent().build();
    }
}
