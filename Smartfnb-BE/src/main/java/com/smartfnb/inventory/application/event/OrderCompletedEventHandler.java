package com.smartfnb.inventory.application.event;

import com.smartfnb.inventory.domain.service.InventoryDomainService;
import com.smartfnb.menu.infrastructure.persistence.AddonJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.AddonJpaRepository;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaRepository;
import com.smartfnb.order.domain.event.OrderCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Consumer xử lý sự kiện đơn hàng hoàn tất — trừ kho theo FIFO.
 *
 * <p>Lắng nghe {@code OrderCompletedEvent} từ Order module (Spring @EventListener).</p>
 * <p>@Async: không block thread của Order module — chạy trong thread pool riêng.</p>
 * <p>@Transactional: transaction riêng cho Inventory — tách biệt hoàn toàn.</p>
 *
 * <p>Logic FIFO per item trong đơn hàng:
 * <ol>
 *   <li>Lấy Recipe của từng menuItem → danh sách nguyên liệu cần trừ</li>
 *   <li>Số lượng cần trừ = recipe.quantity × orderItem.quantity</li>
 *   <li>Gọi {@code InventoryDomainService.deductFifo()} cho từng nguyên liệu</li>
 *   <li>Domain service tự xử lý FIFO + publish LowStockAlertEvent</li>
 * </ol>
 * </p>
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderCompletedEventHandler {

    private final InventoryDomainService inventoryDomainService;

    /** Repository công thức chế biến — từ Menu module (cross-module read) */
    private final RecipeJpaRepository recipeJpaRepository;

    private final AddonJpaRepository addonJpaRepository;

    /**
     * Lắng nghe sự kiện đơn hàng hoàn tất và trừ kho theo FIFO.
     *
     * @param event sự kiện chứa danh sách món đã bán
     */
    @EventListener
    @Async
    @Transactional
    public void onOrderCompleted(OrderCompletedEvent event) {
        log.info("Bắt đầu trừ kho FIFO cho đơn hàng: {}", event.orderNumber());

        try {
            for (OrderCompletedEvent.CompletedOrderItem orderItem : event.items()) {
                // Lấy tất cả nguyên liệu trong công thức của món này
                List<RecipeJpaEntity> recipes =
                    recipeJpaRepository.findByTargetItemId(orderItem.menuItemId());

                if (recipes.isEmpty()) {
                    log.debug("Món {} không có công thức nguyên liệu — bỏ qua trừ kho cho món chính",
                        orderItem.menuItemId());
                }

                for (RecipeJpaEntity recipe : recipes) {
                    // Số lượng nguyên liệu cần trừ = recipe.quantity × số lượng bán
                    BigDecimal needed = recipe.getQuantity()
                        .multiply(BigDecimal.valueOf(orderItem.quantity()));

                    try {
                        inventoryDomainService.deductFifo(
                            event.tenantId(),
                            event.branchId(),
                            recipe.getIngredientItemId(),
                            "Nguyên liệu #" + recipe.getIngredientItemId(),  // tên resolve sau
                            needed,
                            "SALE_DEDUCT",
                            event.orderId(),
                            "ORDER",
                            null  // System deducted
                        );
                    } catch (com.smartfnb.inventory.domain.exception
                             .InsufficientStockException e) {
                        // Không throw — tránh rollback toàn bộ đơn hàng đã hoàn tất
                        // Ghi cảnh báo để xử lý thủ công (business rule: chấp nhận lỗi kho)
                        log.warn("Không đủ kho khi trừ FIFO: orderId={}, ingredient={}, lý do={}",
                            event.orderId(), recipe.getIngredientItemId(), e.getMessage());
                    }
                }

                // Xử lý trừ kho cho Topping/Addon (Nếu có)
                if (orderItem.addons() != null && !orderItem.addons().isEmpty()) {
                    for (OrderCompletedEvent.CompletedAddonItem addonItem : orderItem.addons()) {
                        try {
                            AddonJpaEntity addonEntity = addonJpaRepository.findById(addonItem.addonId())
                                .orElse(null);

                            if (addonEntity != null && addonEntity.getItemId() != null) {
                                // Số lượng cần trừ = quantity của orderItem * quantity của addon * định lượng 1 addon
                                BigDecimal neededAddon = BigDecimal.valueOf((long) orderItem.quantity() * addonItem.quantity())
                                        .multiply(addonEntity.getItemQuantity());

                                inventoryDomainService.deductFifo(
                                    event.tenantId(),
                                    event.branchId(),
                                    addonEntity.getItemId(),
                                    "Addon #" + addonEntity.getItemId(), // Tên sẽ được resolve sau
                                    neededAddon,
                                    "SALE_DEDUCT",
                                    event.orderId(),
                                    "ORDER_ADDON",
                                    null
                                );
                            }
                        } catch (com.smartfnb.inventory.domain.exception.InsufficientStockException e) {
                            log.warn("Không đủ kho khi trừ FIFO cho addon: orderId={}, addon_item={}, lý do={}",
                                event.orderId(), addonItem.addonId(), e.getMessage());
                        } catch (Exception e) {
                            log.error("Lỗi chưa xác định khi trừ addon kho: addonId={}, lỗi={}", addonItem.addonId(), e.getMessage());
                        }
                    }
                }
            }

            log.info("Trừ kho FIFO hoàn tất cho đơn hàng: {}", event.orderNumber());

        } catch (Exception e) {
            log.error("Lỗi trừ kho FIFO cho đơn hàng {}: {}",
                event.orderNumber(), e.getMessage(), e);
            // TODO Phase 2: Gửi vào Dead Letter Queue để retry tự động
        }
    }
}
