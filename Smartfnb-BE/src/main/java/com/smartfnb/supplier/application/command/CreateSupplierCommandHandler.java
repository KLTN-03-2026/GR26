package com.smartfnb.supplier.application.command;

import com.smartfnb.supplier.infrastructure.persistence.SupplierJpaEntity;
import com.smartfnb.supplier.infrastructure.persistence.SupplierJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Handler tạo nhà cung cấp mới.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CreateSupplierCommandHandler {

    private final SupplierJpaRepository supplierJpaRepository;

    @Transactional
    public UUID handle(CreateSupplierCommand command) {
        log.info("Tạo nhà cung cấp mới: name={}, tenant={}", command.name(), command.tenantId());

        SupplierJpaEntity entity = SupplierJpaEntity.create(
                command.tenantId(),
                command.name(),
                command.code(),
                command.contactName(),
                command.phone(),
                command.email(),
                command.address(),
                command.taxCode(),
                command.note()
        );

        SupplierJpaEntity saved = supplierJpaRepository.save(entity);
        log.info("Tạo nhà cung cấp thành công: supplierId={}", saved.getId());
        return saved.getId();
    }
}
