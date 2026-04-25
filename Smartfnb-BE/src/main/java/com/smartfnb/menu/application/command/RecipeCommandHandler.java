package com.smartfnb.menu.application.command;

import com.smartfnb.menu.application.dto.CreateRecipeRequest;
import com.smartfnb.menu.application.dto.UpdateRecipeRequest;
import com.smartfnb.menu.application.dto.RecipeResponse;
import com.smartfnb.menu.domain.exception.MenuItemNotFoundException;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaRepository;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaRepository;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Command Handler xử lý CRUD cho Recipe (công thức chế biến).
 *
 * @author vutq
 * @since 2026-03-28
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RecipeCommandHandler {

    private final RecipeJpaRepository recipeJpaRepository;
    private final MenuItemJpaRepository menuItemJpaRepository;

    /**
     * Thêm một dòng nguyên liệu vào công thức của món ăn.
     * Validate:
     * - Món ăn đích phải tồn tại trong tenant
     * - (target_item_id, ingredient_item_id) phải unique
     * - Định lượng phải > 0
     *
     * @param request thông tin công thức cần thêm
     * @return DTO response chứa thông tin công thức vừa tạo
     * @throws MenuItemNotFoundException nếu món ăn không tồn tại
     * @throws SmartFnbException         nếu công thức đã tồn tại
     */
    @Transactional
    public RecipeResponse createRecipe(CreateRecipeRequest request) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Thêm nguyên liệu {} vào công thức món {} cho tenant {}",
                request.ingredientItemId(), request.targetItemId(), tenantId);

        // Verify món ăn đích tồn tại trong tenant
        MenuItemJpaEntity targetItem = menuItemJpaRepository
                .findByIdAndTenantIdAndDeletedAtIsNull(request.targetItemId(), tenantId)
                .orElseThrow(() -> new MenuItemNotFoundException(request.targetItemId()));

        // Kiểm tra unique (target + ingredient)
        if (recipeJpaRepository.existsByTargetItemIdAndIngredientItemId(
                request.targetItemId(), request.ingredientItemId())) {
            throw new SmartFnbException("DUPLICATE_RECIPE",
                    "Nguyên liệu này đã tồn tại trong công thức của món. " +
                    "Hãy cập nhật dòng hiện có thay vì thêm mới.");
        }

        RecipeJpaEntity entity = new RecipeJpaEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setTargetItemId(request.targetItemId());
        entity.setIngredientItemId(request.ingredientItemId());
        entity.setQuantity(request.quantity());
        entity.setUnit(request.unit());

        // FIX BUG: Author: HOÀNG | 16/04/2026
        // Lưu sản lượng đầu ra chuẩn để handler tính đúng scaleFactor khi ghi nhận mẻ sản xuất.
        // Với recipe SUB_ASSEMBLY: baseOutputQuantity phải được nhập từ FE.
        // Với recipe SELLABLE: để null, handler sẽ dùng scaleFactor = 1.
        entity.setBaseOutputQuantity(request.baseOutputQuantity());
        entity.setBaseOutputUnit(request.baseOutputUnit());

        RecipeJpaEntity saved = recipeJpaRepository.save(entity);
        log.info("Đã thêm nguyên liệu vào công thức, recipe ID: {}", saved.getId());

        MenuItemJpaEntity ingredientItem = menuItemJpaRepository
                .findById(request.ingredientItemId())
                .orElse(null);
        String ingredientName = ingredientItem != null ? ingredientItem.getName() : "Chưa xác định";

        return RecipeResponse.from(saved, targetItem.getName(), ingredientName);
    }

    /**
     * Cập nhật định lượng nguyên liệu trong công thức.
     *
     * <p>FIX BUG: Author: HOÀNG | 16/04/2026 — đổi signature nhận UpdateRecipeRequest
     * thay vì từng param rời để có thể xử lý thêm baseOutputQuantity và baseOutputUnit.</p>
     *
     * @param recipeId ID dòng công thức cần cập nhật
     * @param request  DTO chứa quantity, unit, baseOutputQuantity, baseOutputUnit
     * @return DTO response sau cập nhật
     * @throws SmartFnbException nếu không tìm thấy hoặc định lượng không hợp lệ
     */
    @Transactional
    public RecipeResponse updateRecipe(UUID recipeId, UpdateRecipeRequest request) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Cập nhật công thức {} cho tenant {}", recipeId, tenantId);

        RecipeJpaEntity entity = recipeJpaRepository
                .findByIdAndTenantId(recipeId, tenantId)
                .orElseThrow(() -> new SmartFnbException("RECIPE_NOT_FOUND",
                        "Không tìm thấy công thức với ID: " + recipeId));

        BigDecimal quantity = request.quantity();
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new SmartFnbException("INVALID_QUANTITY",
                    "Định lượng nguyên liệu phải lớn hơn 0");
        }

        entity.setQuantity(quantity);
        if (request.unit() != null) {
            entity.setUnit(request.unit());
        }

        // FIX BUG: Author: HOÀNG | 16/04/2026
        // Cập nhật sản lượng chuẩn nếu request có gửi lên (null = giữ nguyên giá trị cũ).
        // Cho phép sửa lại các recipe SUB_ASSEMBLY đã lưu sai baseOutputQuantity trước khi có fix này.
        if (request.baseOutputQuantity() != null) {
            entity.setBaseOutputQuantity(request.baseOutputQuantity());
        }
        if (request.baseOutputUnit() != null) {
            entity.setBaseOutputUnit(request.baseOutputUnit());
        }

        RecipeJpaEntity saved = recipeJpaRepository.save(entity);
        log.info("Đã cập nhật công thức {} thành công", recipeId);

        String targetName = menuItemJpaRepository.findById(entity.getTargetItemId())
                .map(MenuItemJpaEntity::getName).orElse("Chưa xác định");
        String ingredientName = menuItemJpaRepository.findById(entity.getIngredientItemId())
                .map(MenuItemJpaEntity::getName).orElse("Chưa xác định");

        return RecipeResponse.from(saved, targetName, ingredientName);
    }

    /**
     * Xóa một dòng nguyên liệu khỏi công thức.
     *
     * @param recipeId ID dòng công thức cần xóa
     * @throws SmartFnbException nếu không tìm thấy
     */
    @Transactional
    public void deleteRecipe(UUID recipeId) {
        UUID tenantId = TenantContext.requireCurrentTenantId();

        log.info("Xóa công thức {} của tenant {}", recipeId, tenantId);

        RecipeJpaEntity entity = recipeJpaRepository
                .findByIdAndTenantId(recipeId, tenantId)
                .orElseThrow(() -> new SmartFnbException("RECIPE_NOT_FOUND",
                        "Không tìm thấy công thức với ID: " + recipeId));

        recipeJpaRepository.delete(entity);
        log.info("Đã xóa công thức {} thành công", recipeId);
    }
}
