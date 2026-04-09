package com.smartfnb.supplier.application.command;

import com.smartfnb.supplier.domain.exception.SupplierNotFoundException;
import com.smartfnb.supplier.infrastructure.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Handler tạo đơn mua hàng mới (trạng thái DRAFT).
 * Luồng: Validate supplier → Sinh order_number → Tạo PO + items → Tính total.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CreatePurchaseOrderCommandHandler {

    private final PurchaseOrderJpaRepository purchaseOrderJpaRepository;
    private final SupplierJpaRepository      supplierJpaRepository;

    @Transactional
    public UUID handle(CreatePurchaseOrderCommand command) {
        log.info("Tạo đơn mua hàng: supplierId={}, branch={}", command.supplierId(), command.branchId());

        // 1. Validate supplier thuộc tenant
        supplierJpaRepository.findByIdAndTenantId(command.supplierId(), command.tenantId())
                .orElseThrow(() -> new SupplierNotFoundException(command.supplierId()));

        // 2. Sinh order_number dạng PO-{branchCode}-{date}-{seq}
        String orderNumber = generateOrderNumber(command.tenantId(), command.branchId());

        // 3. Tạo PurchaseOrder entity
        PurchaseOrderJpaEntity po = PurchaseOrderJpaEntity.create(
                command.tenantId(),
                command.branchId(),
                command.supplierId(),
                orderNumber,
                command.note(),
                command.expectedDate(),
                command.createdBy()
        );

        // 4. Thêm items
        for (CreatePurchaseOrderCommand.PurchaseOrderItemCommand item : command.items()) {
            PurchaseOrderItemJpaEntity itemEntity = PurchaseOrderItemJpaEntity.create(
                    po,
                    item.itemId(),
                    item.itemName(),
                    item.unit(),
                    item.quantity(),
                    item.unitPrice(),
                    item.note()
            );
            po.getItems().add(itemEntity);
        }

        // 5. Tính total
        po.recalculateTotal();

        // 6. Lưu
        PurchaseOrderJpaEntity saved = purchaseOrderJpaRepository.save(po);
        log.info("Tạo đơn mua hàng thành công: poId={}, orderNumber={}", saved.getId(), orderNumber);
        return saved.getId();
    }

    private String generateOrderNumber(UUID tenantId, UUID branchId) {
        String date     = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String branchSuffix = branchId.toString().substring(0, 4).toUpperCase();
        long   count    = purchaseOrderJpaRepository.countByTenantIdAndBranchId(tenantId, branchId);
        return String.format("PO-%s-%s-%06d", branchSuffix, date, count + 1);
    }
}
