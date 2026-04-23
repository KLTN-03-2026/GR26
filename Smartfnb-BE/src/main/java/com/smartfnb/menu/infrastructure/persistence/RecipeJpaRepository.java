package com.smartfnb.menu.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository cho bảng recipes.
 * Quản lý công thức chế biến: món bán → nguyên liệu + định lượng.
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
public interface RecipeJpaRepository extends JpaRepository<RecipeJpaEntity, UUID> {

    /**
     * Kiểm tra công thức (target + ingredient) đã tồn tại chưa.
     * Unique constraint: (target_item_id, ingredient_item_id).
     *
     * @param targetItemId     ID món đích
     * @param ingredientItemId ID nguyên liệu
     * @return true nếu đã tồn tại
     */
    boolean existsByTargetItemIdAndIngredientItemId(UUID targetItemId, UUID ingredientItemId);

    /**
     * Kiểm tra duplicate khi update.
     *
     * @param targetItemId     ID món đích
     * @param ingredientItemId ID nguyên liệu
     * @param excludedId       ID bản ghi đang update
     * @return true nếu đã tồn tại ở bản ghi khác
     */
    boolean existsByTargetItemIdAndIngredientItemIdAndIdNot(
            UUID targetItemId, UUID ingredientItemId, UUID excludedId);

    /**
     * Lấy tất cả công thức của một món bán.
     * Dùng trước khi tạo đơn để kiểm tra tồn kho nguyên liệu.
     *
     * @param targetItemId ID món đích
     * @return danh sách công thức
     */
    List<RecipeJpaEntity> findByTargetItemId(UUID targetItemId);

    /**
     * Lấy công thức theo ID và tenant (chống IDOR).
     *
     * @param id       ID công thức
     * @param tenantId ID tenant
     * @return Optional chứa công thức hoặc empty
     */
    Optional<RecipeJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * Lấy tất cả công thức của nhiều món — dùng khi đơn có nhiều item.
     * Giúp tránh N+1 query khi kiểm tra tồn kho cho đơn hàng.
     *
     * @param targetItemIds tập hợp ID món đích
     * @return danh sách công thức của tất cả món
     */
    @Query("SELECT r FROM RecipeJpaEntity r WHERE r.targetItemId IN :targetItemIds")
    List<RecipeJpaEntity> findByTargetItemIdIn(@Param("targetItemIds") List<UUID> targetItemIds);
}
