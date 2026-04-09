package com.smartfnb.inventory.application.command;

import com.smartfnb.inventory.domain.event.StockImportedEvent;
import com.smartfnb.inventory.domain.service.InventoryDomainService;
import com.smartfnb.inventory.infrastructure.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Handler xử lý lệnh nhập kho nguyên liệu.
 * Luồng:
 * <ol>
 *   <li>Tạo StockBatch mới</li>
 *   <li>Cập nhật inventory_balance (upsert)</li>
 *   <li>Ghi inventory_transaction (IMPORT)</li>
 *   <li>Publish StockImportedEvent</li>
 * </ol>
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ImportStockCommandHandler {

    private final StockBatchJpaRepository          stockBatchJpaRepository;
    private final InventoryTransactionJpaRepository inventoryTransactionJpaRepository;
    private final InventoryDomainService            inventoryDomainService;
    private final ApplicationEventPublisher         eventPublisher;

    /**
     * Xử lý nhập kho: tạo batch, cập nhật balance, ghi log, publish event.
     *
     * @param command thông tin nhập kho
     * @return UUID của StockBatch vừa tạo
     */
    @Transactional
    public UUID handle(ImportStockCommand command) {
        log.info("Nhập kho: item={}, quantity={}, branch={}",
            command.itemId(), command.quantity(), command.branchId());

        // 1. Tạo StockBatch mới
        StockBatchJpaEntity batch = StockBatchJpaEntity.create(
            command.tenantId(),
            command.branchId(),
            command.itemId(),
            command.supplierId(),
            command.quantity(),
            command.costPerUnit(),
            command.expiresAt()
        );
        StockBatchJpaEntity savedBatch = stockBatchJpaRepository.save(batch);

        // 2. Cập nhật inventory_balance (upsert pattern)
        inventoryDomainService.increaseBalance(
            command.tenantId(),
            command.branchId(),
            command.itemId(),
            null,          // item_name sẽ được update nếu upsert tạo mới
            null,          // unit — app tự resolve hoặc FE truyền
            command.quantity(),
            null           // minLevel — không thay đổi khi nhập
        );

        // 3. Ghi inventory_transaction
        InventoryTransactionJpaEntity tx = InventoryTransactionJpaEntity.forImport(
            command.tenantId(),
            command.branchId(),
            command.itemId(),
            command.userId(),
            savedBatch.getId(),
            command.quantity(),
            command.costPerUnit(),
            command.note()
        );
        inventoryTransactionJpaRepository.save(tx);

        // 4. Publish StockImportedEvent (consumer: Report, Supplier modules)
        eventPublisher.publishEvent(new StockImportedEvent(
            savedBatch.getId(),
            command.tenantId(),
            command.branchId(),
            command.itemId(),
            null,
            command.quantity().doubleValue(),
            command.costPerUnit().doubleValue(),
            command.userId(),
            Instant.now()
        ));

        log.info("Nhập kho thành công: batchId={}", savedBatch.getId());
        return savedBatch.getId();
    }
}
