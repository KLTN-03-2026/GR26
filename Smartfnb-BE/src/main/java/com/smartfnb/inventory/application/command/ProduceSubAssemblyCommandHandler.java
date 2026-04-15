package com.smartfnb.inventory.application.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfnb.inventory.domain.model.ItemType;
import com.smartfnb.inventory.domain.model.ProductionBatch;
import com.smartfnb.inventory.domain.repository.ProductionBatchRepository;
import com.smartfnb.inventory.domain.service.InventoryDomainService;
import com.smartfnb.inventory.infrastructure.persistence.*;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaRepository;
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
 * Xử lý nghiệp vụ sản xuất bán thành phẩm.
 * 
 * Nghiệp vụ:
 * 1. Kiểm tra mặt hàng mục tiêu có phải là Bán thành phẩm (SUB_ASSEMBLY).
 * 2. Lấy công thức (Recipe) và tính toán nguyên liệu tiêu thụ.
 * 3. Kiểm tra tồn kho thành phần (Validation).
 * 4. Khấu trừ FIFO nguyên liệu.
 * 5. Tăng tồn kho bán thành phẩm và tạo lô hàng (Batch) mới.
 * 6. Lưu lịch sử mẻ sản xuất.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProduceSubAssemblyCommandHandler {

    private final ProductionBatchRepository productionBatchRepository;
    private final InventoryItemJpaRepository itemJpaRepository;
    private final RecipeJpaRepository recipeJpaRepository;
    private final InventoryDomainService inventoryDomainService;
    private final InventoryTransactionJpaRepository transactionJpaRepository;
    private final StockBatchJpaRepository stockBatchJpaRepository;
    private final ObjectMapper objectMapper;

    /**
     * Thực thi lệnh sản xuất.
     * Sử dụng @Transactional để đảm bảo tất cả biến động kho và mẻ sản xuất được lưu nguyên tử.
     */
    @Transactional
    public UUID handle(ProduceSubAssemblyCommand command) {
        log.info("Bắt đầu xử lý sản xuất: item={}, qty={}, branch={}", 
                command.subAssemblyId(), command.actualOutput(), command.branchId());

        // 1. Kiểm tra mặt hàng đích
        InventoryItemJpaEntity subAssembly = itemJpaRepository.findByIdAndTenantId(command.subAssemblyId(), command.tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bán thành phẩm với ID: " + command.subAssemblyId()));

        if (subAssembly.getType() != ItemType.SUB_ASSEMBLY) {
            throw new IllegalArgumentException("Mặt hàng mục tiêu phải là Bán thành phẩm (SUB_ASSEMBLY).");
        }

        // 2. Lấy công thức
        List<RecipeJpaEntity> recipes = recipeJpaRepository.findByTargetItemId(command.subAssemblyId());
        if (recipes.isEmpty()) {
            throw new IllegalArgumentException("Bán thành phẩm này chưa được cấu hình công thức nấu ăn.");
        }

        // 3. Chuẩn bị snapshot công thức (Audit trail)
        String recipeSnapshot;
        try {
            recipeSnapshot = objectMapper.writeValueAsString(recipes);
        } catch (Exception e) {
            log.error("Lỗi khi tạo snapshot công thức", e);
            recipeSnapshot = "[]";
        }

        // 4. Tạo đối tượng Domain ProductionBatch
        ProductionBatch batch = ProductionBatch.builder()
                .tenantId(command.tenantId())
                .branchId(command.branchId())
                .subAssemblyItemId(command.subAssemblyId())
                .recipeSnapshot(recipeSnapshot)
                .expectedOutput(command.expectedOutput())
                .actualOutput(command.actualOutput())
                .unit(subAssembly.getUnit())
                .producedBy(command.producedBy())
                .note(command.note())
                .build();

        // 5. Tính toán và khấu trừ nguyên liệu (FIFO)
        // Lấy danh sách ID nguyên liệu để lấy tên (phục vụ log/alert)
        List<UUID> ingredientIds = recipes.stream()
                .map(RecipeJpaEntity::getIngredientItemId)
                .collect(Collectors.toList());
        
        Map<UUID, InventoryItemJpaEntity> ingredientDetails = itemJpaRepository.findAllById(ingredientIds)
                .stream().collect(Collectors.toMap(InventoryItemJpaEntity::getId, i -> i));

        for (RecipeJpaEntity recipe : recipes) {
            BigDecimal needed = recipe.getQuantity().multiply(command.actualOutput());
            InventoryItemJpaEntity ingredient = ingredientDetails.get(recipe.getIngredientItemId());
            String ingredientName = ingredient != null ? ingredient.getName() : recipe.getIngredientItemId().toString();

            // Khấu trừ FIFO và ghi giao dịch PRODUCTION_OUT
            inventoryDomainService.deductFifo(
                    command.tenantId(),
                    command.branchId(),
                    recipe.getIngredientItemId(),
                    ingredientName,
                    needed,
                    "PRODUCTION_OUT",
                    batch.getId(),
                    "PRODUCTION",
                    command.producedBy()
            );
        }

        // 6. Tăng tồn kho bán thành phẩm đầu ra
        inventoryDomainService.increaseBalance(
                command.tenantId(),
                command.branchId(),
                command.subAssemblyId(),
                subAssembly.getName(),
                subAssembly.getUnit(),
                command.actualOutput(),
                BigDecimal.ZERO // Mặc định không set minLevel tại đây
        );

        // 7. Tạo giao dịch PRODUCTION_IN
        InventoryTransactionJpaEntity inTx = InventoryTransactionJpaEntity.forProductionIn(
                command.tenantId(),
                command.branchId(),
                command.subAssemblyId(),
                command.producedBy(),
                command.actualOutput(),
                command.note(),
                batch.getId()
        );
        transactionJpaRepository.save(inTx);

        // 8. Tạo StockBatch mới cho bán thành phẩm để có thể khấu trừ FIFO sau này
        // Lưu ý: costPerUnit tạm thời để là 0 hoặc có thể tính toán từ trung bình giá nguyên liệu (optional nâng cao)
        StockBatchJpaEntity newBatch = StockBatchJpaEntity.create(
                command.tenantId(),
                command.branchId(),
                command.subAssemblyId(),
                null, // Supplier null vì tự sản xuất
                command.actualOutput(),
                BigDecimal.ZERO, // Tạm thời để giá vốn = 0
                null // Không có hạn sử dụng mặc định
        );
        stockBatchJpaRepository.save(newBatch);

        // 9. Lưu mẻ sản xuất
        productionBatchRepository.save(batch);

        log.info("Sản xuất thành công: batchId={}", batch.getId());
        return batch.getId();
    }
}
