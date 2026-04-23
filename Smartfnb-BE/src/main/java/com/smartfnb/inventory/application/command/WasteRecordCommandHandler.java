package com.smartfnb.inventory.application.command;

import com.smartfnb.inventory.domain.event.LowStockAlertEvent;
import com.smartfnb.inventory.domain.service.InventoryDomainService;
import com.smartfnb.inventory.infrastructure.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Handler xử lý ghi nhận hao hụt nguyên liệu (S-14).
 * Hao hụt = giảm kho với lý do ghi rõ (waste, expire, spill...).
 *
 * Luồng:
 * <ol>
 *   <li>Giảm inventory_balance (kiểm tra không âm)</li>
 *   <li>Ghi inventory_transaction (WASTE)</li>
 *   <li>Ghi audit_log</li>
 *   <li>Publish LowStockAlertEvent nếu cần</li>
 * </ol>
 *
 * @author vutq
 * @since 2026-04-03
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WasteRecordCommandHandler {

    private final InventoryTransactionJpaRepository inventoryTransactionJpaRepository;
    private final AuditLogJpaRepository             auditLogJpaRepository;
    private final InventoryDomainService            inventoryDomainService;
    private final ApplicationEventPublisher         eventPublisher;

    /**
     * Ghi nhận hao hụt nguyên liệu.
     *
     * @param command lệnh ghi hao hụt với quantity và reason
     */
    @Transactional
    public void handle(WasteRecordCommand command) {
        log.info("Ghi hao hụt: item={}, qty={}, reason={}",
            command.itemId(), command.quantity(), command.reason());

        // 1. Giảm balance (domain service kiểm tra đủ tồn kho không)
        InventoryBalanceJpaEntity balance = inventoryDomainService.decreaseBalance(
            command.branchId(), command.itemId(), command.quantity()
        );

        // 2. Ghi inventory_transaction (WASTE)
        InventoryTransactionJpaEntity tx = InventoryTransactionJpaEntity.forWaste(
            command.tenantId(), command.branchId(),
            command.itemId(), command.userId(),
            command.quantity(), command.reason()
        );
        inventoryTransactionJpaRepository.save(tx);

        // 3. Ghi audit_log
        String detail = String.format(java.util.Locale.US,
            "{\"quantity_wasted\": %.4f, \"reason\": \"%s\"}",
            command.quantity().doubleValue(), command.reason()
        );
        AuditLogJpaEntity auditLog = AuditLogJpaEntity.forWasteRecord(
            command.tenantId(), command.userId(),
            command.itemId(), detail
        );
        auditLogJpaRepository.save(auditLog);

        // 4. Cảnh báo nếu sau waste còn thấp
        if (balance.isBelowMinLevel()) {
            log.warn("Tồn kho dưới ngưỡng sau ghi hao hụt: item={}", command.itemId());
            eventPublisher.publishEvent(new LowStockAlertEvent(
                command.branchId(), command.tenantId(),
                command.itemId(), balance.getItemName(),
                balance.getQuantity().doubleValue(),
                balance.getMinLevel().doubleValue(),
                balance.getUnit(),
                Instant.now()
            ));
        }

        log.info("Ghi hao hụt thành công: item={}, qty={}", command.itemId(), command.quantity());
    }
}
