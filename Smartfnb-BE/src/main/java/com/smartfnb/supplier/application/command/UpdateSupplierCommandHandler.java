package com.smartfnb.supplier.application.command;

import com.smartfnb.supplier.domain.exception.SupplierNotFoundException;
import com.smartfnb.supplier.infrastructure.persistence.SupplierJpaEntity;
import com.smartfnb.supplier.infrastructure.persistence.SupplierJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Handler cập nhật / deactivate nhà cung cấp.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UpdateSupplierCommandHandler {

    private final SupplierJpaRepository supplierJpaRepository;

    @Transactional
    public void handle(UpdateSupplierCommand command) {
        log.info("Cập nhật nhà cung cấp: supplierId={}", command.supplierId());

        SupplierJpaEntity entity = supplierJpaRepository
                .findByIdAndTenantId(command.supplierId(), command.tenantId())
                .orElseThrow(() -> new SupplierNotFoundException(command.supplierId()));

        entity.update(command.name(), command.code(), command.contactName(),
                command.phone(), command.email(), command.address(),
                command.taxCode(), command.note(), command.active());

        supplierJpaRepository.save(entity);
        log.info("Cập nhật nhà cung cấp thành công: supplierId={}", command.supplierId());
    }

    /**
     * Soft-delete: chỉ set active = false mà không overwrite các field khác.
     */
    @Transactional
    public void deactivate(UUID supplierId, UUID tenantId) {
        log.info("Deactivate nhà cung cấp: supplierId={}", supplierId);

        SupplierJpaEntity entity = supplierJpaRepository
                .findByIdAndTenantId(supplierId, tenantId)
                .orElseThrow(() -> new SupplierNotFoundException(supplierId));

        entity.deactivate();
        supplierJpaRepository.save(entity);
        log.info("Deactivate thành công: supplierId={}", supplierId);
    }
}
