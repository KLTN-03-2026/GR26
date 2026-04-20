package com.smartfnb.menu.domain.service;

import com.smartfnb.menu.domain.exception.InsufficientStockException;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

/**
 * Domain Service kiểm tra tồn kho nguyên liệu trước khi đặt đơn hàng.
 * Dùng ở S-09 (PlaceOrderCommandHandler) để reject đơn nếu nguyên liệu không đủ.
 *
 * <p>Luồng kiểm tra:
 * <ol>
 *   <li>Nhận danh sách món được đặt + số lượng</li>
 *   <li>Load công thức (Recipe) của tất cả món — dùng bulk query tránh N+1</li>
 *   <li>Tính tổng lượng từng nguyên liệu cần dùng</li>
 *   <li>So sánh với inventory_balances theo branchId</li>
 *   <li>Throw InsufficientStockException nếu thiếu bất kỳ nguyên liệu nào</li>
 * </ol>
 * </p>
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryCheckService {

    private final RecipeJpaRepository recipeJpaRepository;

    /**
     * Kiểm tra tồn kho nguyên liệu cho danh sách món trong đơn hàng.
     * Phương thức này được gọi ĐỒNG BỘ trong PlaceOrderCommandHandler.
     *
     * <p>Lưu ý: currentStockProvider là function để inject từ module Inventory
     * mà không tạo circular dependency. Module Menu không import Inventory.</p>
     *
     * @param branchId             ID chi nhánh đang đặt đơn
     * @param orderLines           Danh sách (itemId → số lượng) trong đơn
     * @param currentStockProvider Function: (branchId, ingredientId) → số lượng tồn kho
     * @param ingredientNameProvider Function: ingredientId → tên nguyên liệu
     * @throws InsufficientStockException nếu bất kỳ nguyên liệu nào không đủ
     */
    public void assertSufficientStock(
            UUID branchId,
            Map<UUID, Integer> orderLines,
            StockProvider currentStockProvider,
            IngredientNameProvider ingredientNameProvider) {

        if (orderLines == null || orderLines.isEmpty()) {
            return;
        }

        log.debug("Kiểm tra tồn kho cho {} món tại chi nhánh {}", orderLines.size(), branchId);

        // Bulk load tất cả recipe tránh N+1 query
        List<UUID> itemIds = new ArrayList<>(orderLines.keySet());
        List<RecipeJpaEntity> allRecipes = recipeJpaRepository.findByTargetItemIdIn(itemIds);

        if (allRecipes.isEmpty()) {
            log.debug("Không có công thức nào — bỏ qua kiểm tra tồn kho");
            return;
        }

        // Tính tổng nguyên liệu cần dùng: ingredientId → tổng lượng cần
        Map<UUID, BigDecimal> requiredIngredients = new HashMap<>();
        for (RecipeJpaEntity recipe : allRecipes) {
            int qty = orderLines.getOrDefault(recipe.getTargetItemId(), 0);
            if (qty <= 0) continue;

            BigDecimal totalNeeded = recipe.getQuantity().multiply(BigDecimal.valueOf(qty));
            requiredIngredients.merge(recipe.getIngredientItemId(), totalNeeded, BigDecimal::add);
        }

        // Kiểm tra từng nguyên liệu với tồn kho thực tế
        for (Map.Entry<UUID, BigDecimal> entry : requiredIngredients.entrySet()) {
            UUID ingredientId = entry.getKey();
            BigDecimal required = entry.getValue();

            BigDecimal available = currentStockProvider.getStock(branchId, ingredientId);

            if (available == null || available.compareTo(required) < 0) {
                String ingredientName = ingredientNameProvider.getName(ingredientId);
                double availableVal = available != null ? available.doubleValue() : 0.0;

                log.warn("Nguyên liệu '{}' không đủ — cần {}, còn {}",
                        ingredientName, required, availableVal);

                throw new InsufficientStockException(
                        ingredientName,
                        required.doubleValue(),
                        availableVal,
                        ""    // unit sẽ được resolve từ recipe nếu cần
                );
            }
        }

        log.debug("Kiểm tra tồn kho thành công — tất cả nguyên liệu đủ");
    }

    /**
     * Interface functional để inject logic lấy tồn kho từ module Inventory.
     * Tránh circular dependency: Menu không import Inventory trực tiếp.
     */
    @FunctionalInterface
    public interface StockProvider {
        /**
         * Lấy số lượng tồn kho hiện tại của một nguyên liệu tại chi nhánh.
         *
         * @param branchId     ID chi nhánh
         * @param ingredientId ID nguyên liệu
         * @return số lượng tồn kho, hoặc null nếu chưa có bản ghi
         */
        BigDecimal getStock(UUID branchId, UUID ingredientId);
    }

    /**
     * Interface functional để lấy tên nguyên liệu cho error message.
     */
    @FunctionalInterface
    public interface IngredientNameProvider {
        /**
         * Lấy tên nguyên liệu theo ID.
         *
         * @param ingredientId ID nguyên liệu
         * @return tên nguyên liệu
         */
        String getName(UUID ingredientId);
    }
}
