package com.smartfnb.inventory.application.query;

import com.smartfnb.inventory.infrastructure.persistence.ProductionBatchJpaEntity;
import com.smartfnb.inventory.infrastructure.persistence.ProductionBatchJpaRepository;
import com.smartfnb.inventory.web.controller.dto.ProductionBatchResponse;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaRepository;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Query Handler lấy danh sách và chi tiết mẻ sản xuất bán thành phẩm.
 * Batch-lookup tên item và tên nhân viên để tránh N+1.
 *
 * @author vutq
 * @since 2026-04-14
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetProductionBatchesQueryHandler {

    private final ProductionBatchJpaRepository productionBatchJpaRepository;
    private final MenuItemJpaRepository menuItemJpaRepository;
    private final StaffJpaRepository staffJpaRepository;

    /**
     * Lấy danh sách mẻ sản xuất theo chi nhánh, phân trang.
     * Batch-lookup tên sub-assembly và tên nhân viên để tránh N+1.
     *
     * @param tenantId ID tenant
     * @param branchId ID chi nhánh
     * @param page     trang (0-indexed)
     * @param size     số bản ghi mỗi trang (tối đa 100)
     * @return trang mẻ sản xuất đã enrich
     */
    public Page<ProductionBatchResponse> handleList(UUID tenantId, UUID branchId, int page, int size) {
        log.debug("Lấy danh sách mẻ sản xuất: branch={}, page={}", branchId, page);

        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100));
        Page<ProductionBatchJpaEntity> batchPage =
                productionBatchJpaRepository.findByTenantAndBranch(tenantId, branchId, pageRequest);

        List<ProductionBatchJpaEntity> batches = batchPage.getContent();

        // Batch-lookup tên sub-assembly (tránh N+1)
        Set<UUID> itemIds = batches.stream()
                .map(ProductionBatchJpaEntity::getSubAssemblyItemId)
                .collect(Collectors.toSet());
        Map<UUID, String> itemNameMap = itemIds.isEmpty() ? Map.of() :
                menuItemJpaRepository.findAllById(itemIds).stream()
                        .collect(Collectors.toMap(MenuItemJpaEntity::getId, MenuItemJpaEntity::getName));

        // Batch-lookup tên nhân viên (tránh N+1)
        Set<UUID> staffIds = batches.stream()
                .map(ProductionBatchJpaEntity::getProducedBy)
                .collect(Collectors.toSet());
        Map<UUID, String> staffNameMap = staffIds.isEmpty() ? Map.of() :
                staffJpaRepository.findAllById(staffIds).stream()
                        .collect(Collectors.toMap(s -> s.getId(), s -> s.getFullName()));

        return batchPage.map(batch -> ProductionBatchResponse.from(
                batch,
                itemNameMap.getOrDefault(batch.getSubAssemblyItemId(), "Bán thành phẩm không xác định"),
                staffNameMap.getOrDefault(batch.getProducedBy(), "Nhân viên không xác định")
        ));
    }

    /**
     * Lấy chi tiết một mẻ sản xuất theo ID.
     *
     * @param id       ID mẻ sản xuất
     * @param tenantId ID tenant (chống IDOR)
     * @return chi tiết mẻ sản xuất đã enrich
     * @throws IllegalArgumentException nếu không tìm thấy
     */
    public ProductionBatchResponse handleGet(UUID id, UUID tenantId) {
        log.debug("Lấy chi tiết mẻ sản xuất: id={}", id);

        ProductionBatchJpaEntity batch = productionBatchJpaRepository
                .findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Mẻ sản xuất không tồn tại: " + id));

        String itemName = menuItemJpaRepository.findById(batch.getSubAssemblyItemId())
                .map(MenuItemJpaEntity::getName)
                .orElse("Bán thành phẩm không xác định");

        String staffName = Optional.ofNullable(batch.getProducedBy())
                .flatMap(staffId -> staffJpaRepository.findById(staffId).map(s -> s.getFullName()))
                .orElse("Nhân viên không xác định");

        return ProductionBatchResponse.from(batch, itemName, staffName);
    }
}
