package com.smartfnb.supplier.application.command;

import com.smartfnb.supplier.domain.exception.PurchaseOrderNotFoundException;
import com.smartfnb.supplier.domain.exception.SupplierNotFoundException;
import com.smartfnb.supplier.infrastructure.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handler cập nhật đơn mua hàng — chỉ cho phép khi trạng thái DRAFT.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UpdatePurchaseOrderCommandHandler {

    private final PurchaseOrderJpaRepository purchaseOrderJpaRepository;
    private final SupplierJpaRepository      supplierJpaRepository;

    @Transactional
    public void handle(UpdatePurchaseOrderCommand command) {
        log.info("Cập nhật PO: poId={}", command.purchaseOrderId());

        PurchaseOrderJpaEntity po = purchaseOrderJpaRepository
                .findByIdAndTenantId(command.purchaseOrderId(), command.tenantId())
                .orElseThrow(() -> new PurchaseOrderNotFoundException(command.purchaseOrderId()));

        // Validate supplier nếu thay đổi
        if (command.supplierId() != null) {
            supplierJpaRepository.findByIdAndTenantId(command.supplierId(), command.tenantId())
                    .orElseThrow(() -> new SupplierNotFoundException(command.supplierId()));
        }

        // Domain logic: chỉ được update khi DRAFT
        po.update(command.supplierId() != null ? command.supplierId() : po.getSupplierId(),
                  command.note(), command.expectedDate());

        // Replace items nếu có gửi lên
        if (command.items() != null && !command.items().isEmpty()) {
            po.getItems().clear();
            for (UpdatePurchaseOrderCommand.PurchaseOrderItemCmd item : command.items()) {
                PurchaseOrderItemJpaEntity itemEntity = PurchaseOrderItemJpaEntity.create(
                        po, item.itemId(), item.itemName(), item.unit(),
                        item.quantity(), item.unitPrice(), item.note()
                );
                po.getItems().add(itemEntity);
            }
            po.recalculateTotal();
        }

        purchaseOrderJpaRepository.save(po);
        log.info("Cập nhật PO thành công: poId={}", po.getId());
    }
}
