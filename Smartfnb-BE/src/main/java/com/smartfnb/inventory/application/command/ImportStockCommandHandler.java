package com.smartfnb.inventory.application.command;

import com.smartfnb.inventory.domain.event.StockImportedEvent;
import com.smartfnb.inventory.domain.service.InventoryDomainService;
import com.smartfnb.inventory.infrastructure.persistence.*;
import com.smartfnb.menu.domain.exception.MenuItemNotFoundException;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaRepository;
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
 * @author vutq
 * @since 2026-04-03
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ImportStockCommandHandler {

    private final StockBatchJpaRepository          stockBatchJpaRepository;
    private final InventoryTransactionJpaRepository inventoryTransactionJpaRepository;
    private final InventoryDomainService            inventoryDomainService;
    private final MenuItemJpaRepository             menuItemJpaRepository;
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

        // Resolve snapshot item từ bảng items để inventory_balances luôn có tên và đơn vị ngay từ lần import đầu.
        MenuItemJpaEntity item = menuItemJpaRepository
            .findByIdAndTenantIdAndDeletedAtIsNull(command.itemId(), command.tenantId())
            .orElseThrow(() -> new MenuItemNotFoundException(command.itemId()));

        // 2. Cập nhật inventory_balance (upsert pattern)
        /*
         * [Hoàng | 2026-04-15 16:14 ICT | comment giữ code cũ gốc từ dòng 61-70]
         * Đoạn cũ truyền null cho item_name và unit, làm inventory_balances tạo snapshot thiếu dữ liệu.
         *
        inventoryDomainService.increaseBalance(
            command.tenantId(),
            command.branchId(),
            command.itemId(),
            null,          // item_name sẽ được update nếu upsert tạo mới
            null,          // unit — app tự resolve hoặc FE truyền
            command.quantity(),
            null           // minLevel — không thay đổi khi nhập
        );
         */
        inventoryDomainService.increaseBalance(
            command.tenantId(),
            command.branchId(),
            command.itemId(),
            item.getName(),
            item.getUnit(),
            command.quantity(),
            null
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
        /*
         * [Hoàng | 2026-04-15 16:14 ICT | comment giữ code cũ gốc từ dòng 85-94]
         * Đoạn cũ publish event với itemName = null, làm downstream consumer không có snapshot tên nguyên liệu.
         *
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
         */
        eventPublisher.publishEvent(new StockImportedEvent(
            savedBatch.getId(),
            command.tenantId(),
            command.branchId(),
            command.itemId(),
            item.getName(),
            command.quantity().doubleValue(),
            command.costPerUnit().doubleValue(),
            command.userId(),
            Instant.now()
        ));

        log.info("Nhập kho thành công: batchId={}", savedBatch.getId());
        return savedBatch.getId();
    }
}
