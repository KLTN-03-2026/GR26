package com.smartfnb.inventory.application.query;

import com.smartfnb.inventory.application.query.result.InventoryTransactionResult;
import com.smartfnb.inventory.infrastructure.persistence.InventoryTransactionJpaEntity;
import com.smartfnb.inventory.infrastructure.persistence.InventoryTransactionJpaRepository;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaRepository;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Query Handler lấy lịch sử giao dịch kho có phân trang và filter.
 * Enrich tên nguyên liệu và tên nhân viên qua batch-lookup để tránh N+1.
 *
 * @author vutq
 * @since 2026-04-14
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetTransactionHistoryQueryHandler {

    private final InventoryTransactionJpaRepository transactionJpaRepository;
    private final MenuItemJpaRepository menuItemJpaRepository;
    private final StaffJpaRepository staffJpaRepository;

    /**
     * Lấy lịch sử giao dịch kho theo filter, phân trang.
     * Batch-lookup tên item và tên nhân viên để tránh N+1 request từ FE.
     *
     * @param tenantId ID tenant (bắt buộc)
     * @param branchId ID chi nhánh (bắt buộc)
     * @param type     loại giao dịch (null = tất cả)
     * @param from     từ thời điểm (null = không giới hạn)
     * @param to       đến thời điểm (null = không giới hạn)
     * @param page     trang (0-indexed)
     * @param size     số bản ghi mỗi trang (tối đa 100)
     * @return trang lịch sử đã enrich
     */
    public Page<InventoryTransactionResult> handle(
            UUID tenantId, UUID branchId,
            String type, Instant from, Instant to,
            int page, int size) {

        log.info("Lấy lịch sử giao dịch kho: branch={}, type={}, from={}, to={}", branchId, type, from, to);

        Instant fallbackFrom = from != null ? from : Instant.EPOCH;
        Instant fallbackTo = to != null ? to : Instant.now().plus(3650, java.time.temporal.ChronoUnit.DAYS);

        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100));
        Page<InventoryTransactionJpaEntity> txPage = transactionJpaRepository.findFiltered(
                tenantId, branchId, type, fallbackFrom, fallbackTo, pageRequest
        );

        List<InventoryTransactionJpaEntity> txList = txPage.getContent();

        // Batch-lookup tên nguyên liệu (tránh N+1)
        Set<UUID> itemIds = txList.stream()
                .filter(t -> t.getItemId() != null)
                .map(InventoryTransactionJpaEntity::getItemId)
                .collect(Collectors.toSet());

        Map<UUID, String> itemNameMap = itemIds.isEmpty() ? Map.of() :
                menuItemJpaRepository.findAllById(itemIds).stream()
                        .collect(Collectors.toMap(MenuItemJpaEntity::getId, MenuItemJpaEntity::getName));

        // Batch-lookup tên nhân viên (tránh N+1)
        Set<UUID> userIds = txList.stream()
                .filter(t -> t.getUserId() != null)
                .map(InventoryTransactionJpaEntity::getUserId)
                .collect(Collectors.toSet());

        Map<UUID, String> staffNameMap = userIds.isEmpty() ? Map.of() :
                staffJpaRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(
                                s -> s.getId(),
                                s -> s.getFullName()
                        ));

        return txPage.map(tx -> new InventoryTransactionResult(
                tx.getId(),
                tx.getType(),
                tx.getItemId(),
                itemNameMap.getOrDefault(tx.getItemId(), "Nguyên liệu không xác định"),
                tx.getQuantity(),
                tx.getCostPerUnit(),
                tx.getUserId(),
                tx.getUserId() != null
                        ? staffNameMap.getOrDefault(tx.getUserId(), "Nhân viên không xác định")
                        : null,
                tx.getReferenceId(),
                tx.getReferenceType(),
                tx.getNote(),
                tx.getCreatedAt()
        ));
    }
}
