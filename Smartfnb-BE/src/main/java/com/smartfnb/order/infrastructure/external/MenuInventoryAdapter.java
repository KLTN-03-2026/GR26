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
 * @author SmartF&B Team
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MenuInventoryAdapter {

    private final InventoryCheckService inventoryCheckService;

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

        // Mock StockProvider cho module Inventory chưa hoàn thiện
        InventoryCheckService.StockProvider stockProvider = (bId, ingredientId) -> {
            log.debug("Mocking số lượng tồn kho cho nguyên liệu {} -> 1000", ingredientId);
            return new BigDecimal("1000.0");
        };

        // Mock IngredientNameProvider
        InventoryCheckService.IngredientNameProvider nameProvider = (ingredientId) -> {
            return "Nguyên liệu " + ingredientId.toString().substring(0, 5);
        };

        inventoryCheckService.assertSufficientStock(branchId, orderLines, stockProvider, nameProvider);
    }
}
