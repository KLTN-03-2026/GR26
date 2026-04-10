package com.smartfnb.supplier.application.query;

import com.smartfnb.supplier.infrastructure.persistence.SupplierJpaEntity;
import com.smartfnb.supplier.infrastructure.persistence.SupplierJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Query handler lấy danh sách nhà cung cấp.
 * Hỗ trợ tìm kiếm theo tên, phân trang.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetSupplierListQueryHandler {

    private final SupplierJpaRepository supplierJpaRepository;

    public Page<SupplierResult> handle(UUID tenantId, String nameFilter, int page, int size) {
        log.debug("Lấy danh sách nhà cung cấp: tenant={}, name={}", tenantId, nameFilter);

        PageRequest pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("name"));

        Page<SupplierJpaEntity> entities;
        if (nameFilter != null && !nameFilter.isBlank()) {
            entities = supplierJpaRepository
                    .findByTenantIdAndNameContainingIgnoreCaseAndActiveTrue(tenantId, nameFilter, pageable);
        } else {
            entities = supplierJpaRepository.findByTenantIdAndActiveTrue(tenantId, pageable);
        }

        return entities.map(SupplierResult::from);
    }

    /** DTO trả về cho danh sách supplier */
    public record SupplierResult(
            UUID id,
            String name,
            String code,
            String contactName,
            String phone,
            String email,
            String address,
            String taxCode,
            boolean active
    ) {
        public static SupplierResult from(SupplierJpaEntity e) {
            return new SupplierResult(
                    e.getId(), e.getName(), e.getCode(),
                    e.getContactName(), e.getPhone(), e.getEmail(),
                    e.getAddress(), e.getTaxCode(), e.isActive()
            );
        }
    }
}
