package com.smartfnb.inventory.application.command;

import com.smartfnb.inventory.domain.event.LowStockAlertEvent;
import com.smartfnb.inventory.infrastructure.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Handler xử lý điều chỉnh kho thủ công (S-14).
 * THEO QUY ĐỊNH: mọi lần adjust PHẢI ghi audit_log với lý do.
 *
 * Luồng:
 * <ol>
 *   <li>Đọc giá trị tồn kho hiện tại</li>
 *   <li>Tính delta = newQuantity - currentQuantity</li>
 *   <li>Ghi audit_log (bắt buộc)</li>
 *   <li>Cập nhật inventory_balance</li>
 *   <li>Ghi inventory_transaction (ADJUSTMENT)</li>
 *   <li>Publish LowStockAlertEvent nếu sau adjust còn dưới ngưỡng</li>
 * </ol>
 *
 * @author vutq
 * @since 2026-04-03
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdjustStockCommandHandler {

    private final InventoryBalanceJpaRepository     inventoryBalanceJpaRepository;
    private final InventoryTransactionJpaRepository inventoryTransactionJpaRepository;
    private final AuditLogJpaRepository             auditLogJpaRepository;
    private final ApplicationEventPublisher         eventPublisher;

    /**
     * Xử lý điều chỉnh kho thủ công.
     *
     * @param command lệnh điều chỉnh với newQuantity và reason
     */
    @Transactional
    public void handle(AdjustStockCommand command) {
        log.info("Điều chỉnh kho: item={}, newQty={}, reason={}",
            command.itemId(), command.newQuantity(), command.reason());

        // 1. Đọc giá trị hiện tại (với lock)
        InventoryBalanceJpaEntity balance = inventoryBalanceJpaRepository
            .findByBranchIdAndItemIdForUpdate(command.branchId(), command.itemId())
            .orElseThrow(() -> new com.smartfnb.inventory.domain.exception
                .IngredientNotFoundException(command.itemId()));

        BigDecimal oldQuantity = balance.getQuantity();
        BigDecimal delta = command.newQuantity().subtract(oldQuantity);

        // 2. Ghi audit_log (bắt buộc theo coding guidelines § 6.3)
        String oldVal = String.format(java.util.Locale.US, "{\"quantity\": %.4f}", oldQuantity.doubleValue());
        String newVal = String.format(java.util.Locale.US, "{\"quantity\": %.4f, \"reason\": \"%s\"}",
            command.newQuantity().doubleValue(), command.reason());

        AuditLogJpaEntity auditLog = AuditLogJpaEntity.forStockAdjustment(
            command.tenantId(), command.userId(),
            command.itemId(), oldVal, newVal
        );
        auditLogJpaRepository.save(auditLog);

        // 3. Cập nhật balance
        if (delta.compareTo(BigDecimal.ZERO) > 0) {
            balance.increaseQuantity(delta);
        } else if (delta.compareTo(BigDecimal.ZERO) < 0) {
            balance.decreaseQuantity(delta.abs());
        }
        inventoryBalanceJpaRepository.save(balance);

        // 4. Ghi inventory_transaction (delta — có thể âm hoặc dương)
        InventoryTransactionJpaEntity tx = InventoryTransactionJpaEntity.forAdjustment(
            command.tenantId(), command.branchId(),
            command.itemId(), command.userId(),
            delta, command.reason()
        );
        inventoryTransactionJpaRepository.save(tx);

        // 5. Cảnh báo nếu tồn kho sau adjust còn thấp
        if (balance.isBelowMinLevel()) {
            log.warn("Tồn kho dưới ngưỡng sau điều chỉnh: item={}", command.itemId());
            eventPublisher.publishEvent(new LowStockAlertEvent(
                command.branchId(), command.tenantId(),
                command.itemId(), balance.getItemName(),
                balance.getQuantity().doubleValue(),
                balance.getMinLevel().doubleValue(),
                balance.getUnit(),
                Instant.now()
            ));
        }

        log.info("Điều chỉnh kho thành công: item={}, delta={}", command.itemId(), delta);
    }
}
