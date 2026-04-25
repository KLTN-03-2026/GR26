package com.smartfnb.order.infrastructure.external;

import com.smartfnb.menu.domain.service.InventoryCheckService;
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
    private final com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaRepository inventoryBalanceJpaRepository;

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
                    .map(com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaEntity::getQuantity)
                    .orElse(BigDecimal.ZERO);
        };

        // Real IngredientNameProvider
        InventoryCheckService.IngredientNameProvider nameProvider = (ingredientId) -> {
            return inventoryBalanceJpaRepository.findByBranchIdAndItemId(branchId, ingredientId)
                    .map(com.smartfnb.inventory.infrastructure.persistence.InventoryBalanceJpaEntity::getItemName)
                    .orElse("Nguyên liệu " + ingredientId.toString().substring(0, 5));
        };

        inventoryCheckService.assertSufficientStock(branchId, orderLines, stockProvider, nameProvider);
    }
}
