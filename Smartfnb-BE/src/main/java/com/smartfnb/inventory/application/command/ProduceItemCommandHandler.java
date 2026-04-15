package com.smartfnb.inventory.application.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfnb.inventory.domain.model.ItemType;
import com.smartfnb.inventory.domain.model.ProductionBatch;
import com.smartfnb.inventory.domain.repository.ProductionBatchRepository;
import com.smartfnb.inventory.domain.service.InventoryDomainService;
import com.smartfnb.inventory.infrastructure.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Xử lý nghiệp vụ sản xuất mặt hàng theo danh sách nguyên liệu đầu vào.
 * 
 * Nghiệp vụ:
 * 1. Kiểm tra mặt hàng đích có hợp lệ (SUB_ASSEMBLY).
 * 2. Khấu trừ FIFO từng nguyên liệu dựa trên danh sách truyền vào.
 * 3. Tăng tồn kho mặt hàng đầu ra và ghi nhận lô hàng mới.
 * 4. Lưu lịch sử mẻ sản xuất.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProduceItemCommandHandler {

    private final ProductionBatchRepository productionBatchRepository;
    private final InventoryItemJpaRepository itemJpaRepository;
    private final InventoryDomainService inventoryDomainService;
    private final InventoryTransactionJpaRepository transactionJpaRepository;
    private final StockBatchJpaRepository stockBatchJpaRepository;
    private final ObjectMapper objectMapper;

    /**
     * Thực thi lệnh sản xuất mặt hàng.
     * Transaction đảm bảo tính toàn vẹn (atomic) cho toàn bộ quá trình trừ kho nguyên liệu và tăng kho thành phẩm.
     */
    @Transactional
    public UUID handle(ProduceItemCommand command) {
        log.info("Bắt đầu xử lý sản xuất theo yêu cầu: outputItemId={}, quantity={}, branch={}", 
                command.outputItemId(), command.quantity(), command.branchId());

        // 1. Kiểm tra mặt hàng đích
        InventoryItemJpaEntity outputItem = itemJpaRepository.findByIdAndTenantId(command.outputItemId(), command.tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mặt hàng với ID: " + command.outputItemId()));

        if (outputItem.getType() != ItemType.SUB_ASSEMBLY) {
            throw new IllegalArgumentException("Mặt hàng mục tiêu phải là Bán thành phẩm (SUB_ASSEMBLY).");
        }

        // 2. Chuẩn bị snapshot nguyên liệu tiêu thụ (Audit trail)
        String ingredientSnapshot;
        try {
            ingredientSnapshot = objectMapper.writeValueAsString(command.ingredients());
        } catch (Exception e) {
            log.error("Lỗi khi tạo snapshot nguyên liệu", e);
            ingredientSnapshot = "[]";
        }

        // 3. Tạo đối tượng Domain ProductionBatch
        ProductionBatch batch = ProductionBatch.builder()
                .tenantId(command.tenantId())
                .branchId(command.branchId())
                .subAssemblyItemId(command.outputItemId())
                .recipeSnapshot(ingredientSnapshot)
                .expectedOutput(command.quantity()) // Trong flow này, expected = actual vì không có recipe gốc để so sánh
                .actualOutput(command.quantity())
                .unit(outputItem.getUnit())
                .producedBy(command.producedBy())
                .note(command.note())
                .build();

        // 4. Khấu trừ nguyên liệu (FIFO)
        List<UUID> ingredientIds = command.ingredients().stream()
                .map(ProduceItemCommand.IngredientItem::itemId)
                .collect(Collectors.toList());
        
        Map<UUID, InventoryItemJpaEntity> ingredientDetails = itemJpaRepository.findAllById(ingredientIds)
                .stream().collect(Collectors.toMap(InventoryItemJpaEntity::getId, i -> i));

        for (ProduceItemCommand.IngredientItem ingredientReq : command.ingredients()) {
            InventoryItemJpaEntity ingredient = ingredientDetails.get(ingredientReq.itemId());
            if (ingredient == null) {
                throw new IllegalArgumentException("Không tìm thấy nguyên liệu với ID: " + ingredientReq.itemId());
            }

            // Khấu trừ FIFO và ghi giao dịch PRODUCTION_OUT. Lỗi InsufficientStockException được throw từ service.
            inventoryDomainService.deductFifo(
                    command.tenantId(),
                    command.branchId(),
                    ingredientReq.itemId(),
                    ingredient.getName(),
                    ingredientReq.quantity(),
                    "PRODUCTION_OUT",
                    batch.getId(),
                    "PRODUCTION",
                    command.producedBy()
            );
        }

        // 5. Tăng tồn kho mặt hàng đầu ra
        inventoryDomainService.increaseBalance(
                command.tenantId(),
                command.branchId(),
                command.outputItemId(),
                outputItem.getName(),
                outputItem.getUnit(),
                command.quantity(),
                BigDecimal.ZERO
        );

        // 6. Tạo giao dịch PRODUCTION_IN
        InventoryTransactionJpaEntity inTx = InventoryTransactionJpaEntity.forProductionIn(
                command.tenantId(),
                command.branchId(),
                command.outputItemId(),
                command.producedBy(),
                command.quantity(),
                command.note(),
                batch.getId()
        );
        transactionJpaRepository.save(inTx);

        // 7. Tạo StockBatch mới cho mặt hàng đầu ra
        StockBatchJpaEntity newBatch = StockBatchJpaEntity.create(
                command.tenantId(),
                command.branchId(),
                command.outputItemId(),
                null, // Tự sản xuất
                command.quantity(),
                BigDecimal.ZERO, // Giá vốn tạm tính = 0
                null
        );
        stockBatchJpaRepository.save(newBatch);

        // 8. Lưu thông tin mẻ sản xuất
        productionBatchRepository.save(batch);

        log.info("Sản xuất thành công (Dynamic): batchId={}", batch.getId());
        return batch.getId();
    }
}
