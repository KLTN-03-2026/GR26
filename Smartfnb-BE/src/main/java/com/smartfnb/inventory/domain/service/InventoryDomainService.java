package com.smartfnb.inventory.domain.service;

import com.smartfnb.inventory.domain.event.LowStockAlertEvent;
import com.smartfnb.inventory.domain.exception.InsufficientStockException;
import com.smartfnb.inventory.infrastructure.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Domain Service xử lý logic nghiệp vụ kho phức tạp.
 * Bao gồm:
 * <ul>
 *   <li>Xuất kho FIFO: consume lô hàng cũ nhất trước</li>
 *   <li>Cảnh báo tồn kho thấp (LowStockAlertEvent)</li>
 * </ul>
 *
 * <p>Class này không trực tiếp là CommandHandler — được inject vào các Handler.</p>
 *
 * @author vutq
 * @since 2026-04-03
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryDomainService {

    private final StockBatchJpaRepository     stockBatchJpaRepository;
    private final InventoryBalanceJpaRepository inventoryBalanceJpaRepository;
    private final InventoryTransactionJpaRepository inventoryTransactionJpaRepository;
    private final ApplicationEventPublisher   eventPublisher;

    /**
     * Xuất kho theo thuật toán FIFO khi đơn hàng hoàn tất.
     * Logic:
     * <ol>
     *   <li>Khóa pessimistic các batch còn hàng theo thứ tự imported_at ASC</li>
     *   <li>Lần lượt trừ từng batch cho đến khi đủ số lượng cần xuất</li>
     *   <li>Ghi inventory_transactions cho mỗi batch bị trừ</li>
     *   <li>Cập nhật inventory_balances (giảm quantity)</li>
     *   <li>Kiểm tra và publish LowStockAlertEvent nếu cần</li>
     * </ol>
     *
     * @param tenantId   UUID tenant
     * @param branchId   UUID chi nhánh
     * @param itemId     UUID nguyên liệu cần xuất
     * @param itemName   tên nguyên liệu (để gửi alert)
     * @param needed     số lượng cần xuất
     * @param orderId    orderId tham chiếu
     * @param transactionType SALE_DEDUCT hoặc PRODUCTION_OUT
     * @param referenceId     orderId hoặc productionBatchId
     * @param referenceType   ORDER hoặc PRODUCTION
     * @param userId          người thực hiện (có thể null nếu là system)
     * @throws InsufficientStockException nếu tổng quantity_remaining < needed
     */
    public void deductFifo(UUID tenantId, UUID branchId,
                            UUID itemId, String itemName,
                            BigDecimal needed,
                            String transactionType,
                            UUID referenceId,
                            String referenceType,
                            UUID userId) {

        log.info("Bắt đầu FIFO deduct: item={}, needed={}, branch={}", itemId, needed, branchId);

        // 1. Lấy danh sách batch còn hàng theo FIFO (với pessimistic lock)
        List<StockBatchJpaEntity> batches =
            stockBatchJpaRepository.findAvailableBatchesFifoForUpdate(branchId, itemId);

        // 2. Kiểm tra tổng tồn kho có đủ không
        BigDecimal totalAvailable = batches.stream()
            .map(StockBatchJpaEntity::getQuantityRemaining)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalAvailable.compareTo(needed) < 0) {
            throw new InsufficientStockException(itemName, needed, totalAvailable);
        }

        // 3. FIFO: consume từng batch cũ nhất trước
        BigDecimal remaining = needed;
        for (StockBatchJpaEntity batch : batches) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal consumeFromBatch = remaining.min(batch.getQuantityRemaining());
            batch.consume(consumeFromBatch);
            stockBatchJpaRepository.save(batch);

            // Ghi inventory_transaction cho mỗi batch bị trừ
            InventoryTransactionJpaEntity tx = InventoryTransactionJpaEntity.forFifoDeduct(
                tenantId, branchId, itemId,
                batch.getId(), consumeFromBatch,
                batch.getCostPerUnit(),
                transactionType, referenceId, referenceType, userId
            );
            inventoryTransactionJpaRepository.save(tx);

            remaining = remaining.subtract(consumeFromBatch);
        }

        // 4. Cập nhật inventory_balances
        InventoryBalanceJpaEntity balance = inventoryBalanceJpaRepository
            .findByBranchIdAndItemIdForUpdate(branchId, itemId)
            .orElse(null);

        if (balance != null) {
            balance.decreaseQuantity(needed);
            inventoryBalanceJpaRepository.save(balance);

            // 5. Phát cảnh báo nếu tồn kho dưới ngưỡng (S-14)
            if (balance.isBelowMinLevel()) {
                log.warn("Tồn kho thấp: item={}, quantity={}, threshold={}",
                    itemId, balance.getQuantity(), balance.getMinLevel());
                eventPublisher.publishEvent(new LowStockAlertEvent(
                    branchId, tenantId, itemId, itemName,
                    balance.getQuantity().doubleValue(),
                    balance.getMinLevel().doubleValue(),
                    null,
                    Instant.now()
                ));
            }
        }

        log.info("FIFO deduct hoàn tất: item={}, needed={}", itemId, needed);
    }

    /**
     * Cập nhật inventory_balance sau khi nhập kho.
     * Upsert: nếu chưa có bản ghi thì tạo mới, có rồi thì cộng thêm.
     *
     * @param tenantId UUID tenant
     * @param branchId UUID chi nhánh
     * @param itemId   UUID nguyên liệu
     * @param itemName tên nguyên liệu
     * @param unit     đơn vị
     * @param quantity số lượng nhập
     * @param minLevel ngưỡng cảnh báo (chỉ set khi tạo mới)
     */
    public void increaseBalance(UUID tenantId, UUID branchId,
                                 UUID itemId, String itemName,
                                 String unit, BigDecimal quantity,
                                 BigDecimal minLevel) {

        inventoryBalanceJpaRepository.upsertBalance(
            tenantId, branchId, itemId, itemName, unit, quantity, minLevel
        );
        log.info("Cập nhật tồn kho: item={}, +{}", itemId, quantity);
    }

    /**
     * Điều chỉnh tồn kho trực tiếp (set absolute value).
     * Dùng trong AdjustStockCommandHandler.
     *
     * @param branchId    UUID chi nhánh
     * @param itemId      UUID nguyên liệu
     * @param newQuantity số lượng mới tuyệt đối
     * @return delta (newQuantity - oldQuantity), có thể âm
     */
    public BigDecimal adjustBalance(UUID branchId, UUID itemId, BigDecimal newQuantity) {
        InventoryBalanceJpaEntity balance = inventoryBalanceJpaRepository
            .findByBranchIdAndItemIdForUpdate(branchId, itemId)
            .orElseThrow(() -> new com.smartfnb.inventory.domain.exception
                .IngredientNotFoundException(itemId));

        BigDecimal oldQuantity = balance.getQuantity();
        BigDecimal delta = newQuantity.subtract(oldQuantity);

        if (delta.compareTo(BigDecimal.ZERO) > 0) {
            balance.increaseQuantity(delta);
        } else if (delta.compareTo(BigDecimal.ZERO) < 0) {
            balance.decreaseQuantity(delta.abs());
        }

        inventoryBalanceJpaRepository.save(balance);
        return delta;
    }

    /**
     * Giảm tồn kho và trả về balance mới (dùng cho WASTE và ADJUSTMENT giảm).
     *
     * @param branchId UUID chi nhánh
     * @param itemId   UUID nguyên liệu
     * @param amount   số lượng cần giảm (dương)
     * @return entity balance sau update
     */
    public InventoryBalanceJpaEntity decreaseBalance(UUID branchId, UUID itemId, BigDecimal amount) {
        InventoryBalanceJpaEntity balance = inventoryBalanceJpaRepository
            .findByBranchIdAndItemIdForUpdate(branchId, itemId)
            .orElseThrow(() -> new com.smartfnb.inventory.domain.exception
                .IngredientNotFoundException(itemId));

        if (balance.getQuantity().compareTo(amount) < 0) {
            throw new InsufficientStockException(
                balance.getItemName() != null ? balance.getItemName() : itemId.toString(),
                amount, balance.getQuantity()
            );
        }
        balance.decreaseQuantity(amount);
        return inventoryBalanceJpaRepository.save(balance);
    }
}
