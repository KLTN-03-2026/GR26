package com.smartfnb.inventory.application.command;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfnb.inventory.domain.exception.InsufficientStockException;
import com.smartfnb.inventory.domain.service.InventoryDomainService;
import com.smartfnb.inventory.infrastructure.persistence.InventoryTransactionJpaEntity;
import com.smartfnb.inventory.infrastructure.persistence.InventoryTransactionJpaRepository;
import com.smartfnb.inventory.infrastructure.persistence.ProductionBatchJpaEntity;
import com.smartfnb.inventory.infrastructure.persistence.ProductionBatchJpaRepository;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaRepository;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Command Handler ghi nhận mẻ sản xuất bán thành phẩm.
 *
 * <p>Flow xử lý (một transaction duy nhất để đảm bảo tính nhất quán):</p>
 * <ol>
 *   <li>Validate sub-assembly item tồn tại và đúng type=SUB_ASSEMBLY</li>
 *   <li>Lấy danh sách nguyên liệu đầu vào từ recipe của sub-assembly</li>
 *   <li>Trừ từng nguyên liệu đầu vào qua InventoryDomainService.deductFifo()</li>
 *   <li>Tăng tồn kho sub-assembly theo actualOutputQuantity</li>
 *   <li>Ghi production_batches record</li>
 *   <li>Log delta (actual - expected) để theo dõi hao hụt chất lượng</li>
 * </ol>
 *
 * @author SmartF&B Team
 * @since 2026-04-14
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RecordProductionBatchCommandHandler {

    private final MenuItemJpaRepository menuItemJpaRepository;
    private final RecipeJpaRepository recipeJpaRepository;
    private final InventoryDomainService inventoryDomainService;
    private final InventoryTransactionJpaRepository inventoryTransactionJpaRepository;
    private final ProductionBatchJpaRepository productionBatchJpaRepository;
    private final ObjectMapper objectMapper;

    /**
     * Ghi nhận một mẻ sản xuất bán thành phẩm.
     *
     * @param command command chứa đầy đủ thông tin mẻ sản xuất
     * @return ID của production_batch vừa tạo
     * @throws IllegalArgumentException  nếu sub-assembly không tồn tại hoặc type sai
     * @throws InsufficientStockException nếu nguyên liệu đầu vào không đủ
     */
    @Transactional
    public UUID handle(RecordProductionBatchCommand command) {
        log.info("Ghi nhận mẻ sản xuất: subAssembly={}, actual={} {}",
                command.subAssemblyItemId(), command.actualOutputQuantity(), command.unit());

        // 1. Validate sub-assembly item
        MenuItemJpaEntity subAssemblyItem = menuItemJpaRepository
                .findById(command.subAssemblyItemId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Bán thành phẩm không tồn tại: " + command.subAssemblyItemId()));

        if (!"SUB_ASSEMBLY".equals(subAssemblyItem.getType())) {
            throw new IllegalArgumentException(
                    "Item " + command.subAssemblyItemId() + " không phải SUB_ASSEMBLY (type=" + subAssemblyItem.getType() + ")");
        }

        // 2. Lấy công thức của sub-assembly
        List<RecipeJpaEntity> recipes = recipeJpaRepository.findByTargetItemId(command.subAssemblyItemId());
        if (recipes.isEmpty()) {
            throw new IllegalArgumentException(
                    "Bán thành phẩm " + subAssemblyItem.getName() + " chưa có công thức nguyên liệu. " +
                    "Vui lòng thiết lập công thức trước khi ghi nhận mẻ sản xuất.");
        }

        // 3. Snapshot công thức để audit
        String recipeSnapshot = buildRecipeSnapshot(recipes);

        // 4. Lưu production_batch trước để có ID làm reference cho transaction
        ProductionBatchJpaEntity batch = new ProductionBatchJpaEntity(command.tenantId());
        batch.setBranchId(command.branchId());
        batch.setSubAssemblyItemId(command.subAssemblyItemId());
        batch.setRecipeSnapshot(recipeSnapshot);
        batch.setExpectedOutput(command.expectedOutputQuantity());
        batch.setActualOutput(command.actualOutputQuantity());
        batch.setUnit(command.unit());
        batch.setProducedBy(command.producedBy());
        batch.setProducedAt(java.time.LocalDateTime.now());
        batch.setNote(command.note());
        batch.setStatus("CONFIRMED");

        ProductionBatchJpaEntity savedBatch = productionBatchJpaRepository.save(batch);

        // 5. Trừ nguyên liệu đầu vào theo FIFO
        for (RecipeJpaEntity recipe : recipes) {
            BigDecimal needed = recipe.getQuantity().multiply(command.expectedOutputQuantity());
            String ingredientName = menuItemJpaRepository.findById(recipe.getIngredientItemId())
                    .map(MenuItemJpaEntity::getName)
                    .orElse("Nguyên liệu #" + recipe.getIngredientItemId());

            log.debug("Trừ nguyên liệu đầu vào: {} × {} = {} {}",
                    ingredientName, command.expectedOutputQuantity(), needed, recipe.getUnit());

            inventoryDomainService.deductFifo(
                    command.tenantId(),
                    command.branchId(),
                    recipe.getIngredientItemId(),
                    ingredientName,
                    needed,
                    "PRODUCTION_OUT",
                    savedBatch.getId(),
                    "PRODUCTION",
                    command.producedBy()
            );
        }

        // 6. Tăng tồn kho sub-assembly theo actualOutputQuantity
        inventoryDomainService.increaseBalance(
                command.tenantId(),
                command.branchId(),
                command.subAssemblyItemId(),
                subAssemblyItem.getName(),
                command.unit(),
                command.actualOutputQuantity(),
                BigDecimal.ZERO  // minLevel giữ nguyên nếu đã set
        );

        // Ghi PRODUCTION_IN transaction cho sub-assembly (audit trail)
        InventoryTransactionJpaEntity productionInTx = InventoryTransactionJpaEntity.forProductionIn(
                command.tenantId(),
                command.branchId(),
                command.subAssemblyItemId(),
                command.producedBy(),
                command.actualOutputQuantity(),
                command.note(),
                savedBatch.getId()
        );
        inventoryTransactionJpaRepository.save(productionInTx);

        // 7. Log delta để theo dõi chất lượng / hao hụt
        BigDecimal delta = savedBatch.getDelta();
        if (delta.compareTo(BigDecimal.ZERO) < 0) {
            log.warn("Mẻ sản xuất {} dưới định mức: actual={}, expected={}, delta={}",
                    savedBatch.getId(), command.actualOutputQuantity(), command.expectedOutputQuantity(), delta);
        } else {
            log.info("Mẻ sản xuất {} hoàn tất: actual={}, expected={}, delta={}",
                    savedBatch.getId(), command.actualOutputQuantity(), command.expectedOutputQuantity(), delta);
        }

        return savedBatch.getId();
    }

    /**
     * Tạo snapshot JSON của công thức tại thời điểm sản xuất.
     * Dùng để audit khi công thức bị sửa sau này.
     *
     * @param recipes danh sách dòng công thức
     * @return JSON string
     */
    private String buildRecipeSnapshot(List<RecipeJpaEntity> recipes) {
        try {
            List<java.util.Map<String, Object>> snapshot = recipes.stream()
                    .map(r -> {
                        java.util.Map<String, Object> entry = new java.util.LinkedHashMap<>();
                        entry.put("ingredientItemId", r.getIngredientItemId().toString());
                        entry.put("quantity", r.getQuantity());
                        entry.put("unit", r.getUnit());
                        return entry;
                    })
                    .toList();
            return objectMapper.writeValueAsString(snapshot);
        } catch (JsonProcessingException e) {
            log.warn("Không thể serialize recipe snapshot: {}", e.getMessage());
            return null;
        }
    }
}
