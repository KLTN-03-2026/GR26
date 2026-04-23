package com.smartfnb.menu.application.query;

import com.smartfnb.menu.application.dto.RecipeResponse;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaRepository;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaRepository;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaEntity;
import com.smartfnb.shared.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Query Handler xử lý các truy vấn READ-ONLY cho công thức chế biến.
 *
 * @author vutq
 * @since 2026-03-28
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RecipeQueryHandler {

    private final RecipeJpaRepository recipeJpaRepository;
    private final MenuItemJpaRepository menuItemJpaRepository;

    /**
     * Lấy tất cả công thức chế biến của một món ăn.
     * Dùng khi quản lý thực đơn hoặc hiển thị nguyên liệu cần dùng.
     *
     * @param targetItemId ID món ăn đích
     * @return danh sách công thức
     */
    public List<RecipeResponse> getRecipesByItem(UUID targetItemId) {
        // Không cần filter tenantId ở đây vì targetItemId đã được validate qua endpoint
        // MenuItem đã check tenantId trước đó.
        List<RecipeJpaEntity> recipes = recipeJpaRepository.findByTargetItemId(targetItemId);
        if (recipes.isEmpty()) {
            return List.of();
        }

        // Gather all target and ingredient IDs to batch fetch
        Set<UUID> itemIds = java.util.HashSet.newHashSet(recipes.size() * 2 + 1);
        itemIds.add(targetItemId);
        for (RecipeJpaEntity recipe : recipes) {
            itemIds.add(recipe.getIngredientItemId());
        }

        // Fetch names in single query
        Map<UUID, String> itemNameMap = menuItemJpaRepository.findAllById(itemIds).stream()
                .collect(Collectors.toMap(MenuItemJpaEntity::getId, MenuItemJpaEntity::getName));

        return recipes.stream()
                .map(entity -> RecipeResponse.from(
                        entity,
                        itemNameMap.getOrDefault(entity.getTargetItemId(), "Chưa xác định"),
                        itemNameMap.getOrDefault(entity.getIngredientItemId(), "Chưa xác định")
                ))
                .toList();
    }
}
