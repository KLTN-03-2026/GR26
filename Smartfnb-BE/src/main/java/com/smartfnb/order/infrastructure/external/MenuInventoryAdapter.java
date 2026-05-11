package com.smartfnb.order.infrastructure.external;

import com.smartfnb.menu.domain.service.InventoryCheckService;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaRepository;
import com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaEntity;
import com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaRepository;
import com.smartfnb.order.domain.model.OrderItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Adapter tích hợp module Menu/Inventory.
 * 
 * @author vutq
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MenuInventoryAdapter {

    private final InventoryCheckService inventoryCheckService;
    private final InventoryBalanceJpaRepository inventoryBalanceJpaRepository;
    private final MenuItemJpaRepository menuItemJpaRepository;

    public void checkStock(UUID branchId, List<OrderItem> items) {
        log.info("Kiểm tra tồn kho qua MenuInventoryAdapter cho chi nhánh {}", branchId);
        
        if (items == null || items.isEmpty()) {
            return;
        }

        // Gom nhóm món theo itemId và quantity
        Map<UUID, Integer> orderLines = items.stream()
                .collect(Collectors.toMap(
                        OrderItem::getItemId,
                        OrderItem::getQuantity,
                        Integer::sum
                ));

        // Real StockProvider reading from Inventory
        InventoryCheckService.StockProvider stockProvider = (bId, ingredientId) -> {
            return inventoryBalanceJpaRepository.findByBranchIdAndItemId(bId, ingredientId)
                    .map(InventoryBalanceJpaEntity::getQuantity)
                    .orElse(BigDecimal.ZERO);
        };

        // Author: Hoàng
        // Date: 2026-05-09
        // Note: Tên/unit nguyên liệu phải lấy từ catalog items trước; tồn kho chỉ là snapshot theo chi nhánh.
        InventoryCheckService.IngredientNameProvider nameProvider =
                ingredientId -> resolveIngredientName(branchId, ingredientId);
        InventoryCheckService.IngredientUnitProvider unitProvider =
                ingredientId -> resolveIngredientUnit(branchId, ingredientId);

        inventoryCheckService.assertSufficientStock(branchId, orderLines, stockProvider, nameProvider, unitProvider);
    }

    // Author: Hoàng
    // Date: 2026-05-09
    // Note: Resolve tên nguyên liệu từ items.name để lỗi thiếu tồn vẫn đúng khi branch chưa có inventory_balances.
    private String resolveIngredientName(UUID branchId, UUID ingredientId) {
        return menuItemJpaRepository.findById(ingredientId)
                .map(MenuItemJpaEntity::getName)
                .filter(name -> !name.isBlank())
                .orElseGet(() -> inventoryBalanceJpaRepository.findByBranchIdAndItemId(branchId, ingredientId)
                        .map(InventoryBalanceJpaEntity::getItemName)
                        .filter(name -> !name.isBlank())
                        .orElse("Nguyên liệu " + ingredientId.toString().substring(0, 5)));
    }

    // Author: Hoàng
    // Date: 2026-05-09
    // Note: Resolve đơn vị từ items.unit để message lỗi không còn khoảng trắng thừa khi tồn kho chưa có snapshot.
    private String resolveIngredientUnit(UUID branchId, UUID ingredientId) {
        return menuItemJpaRepository.findById(ingredientId)
                .map(MenuItemJpaEntity::getUnit)
                .filter(unit -> !unit.isBlank())
                .orElseGet(() -> inventoryBalanceJpaRepository.findByBranchIdAndItemId(branchId, ingredientId)
                        .map(InventoryBalanceJpaEntity::getUnit)
                        .filter(unit -> !unit.isBlank())
                        .orElse(""));
    }
}
