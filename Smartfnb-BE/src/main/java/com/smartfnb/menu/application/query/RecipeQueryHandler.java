package com.smartfnb.menu.application.query;

import com.smartfnb.menu.application.dto.RecipeResponse;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaRepository;
import com.smartfnb.shared.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Query Handler xử lý các truy vấn READ-ONLY cho công thức chế biến.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RecipeQueryHandler {

    private final RecipeJpaRepository recipeJpaRepository;

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
        return recipeJpaRepository
                .findByTargetItemId(targetItemId)
                .stream()
                .map(RecipeResponse::from)
                .toList();
    }
}
