package com.smartfnb.payment.infrastructure.persistence;

import com.smartfnb.payment.domain.model.Invoice;
import com.smartfnb.payment.domain.model.InvoiceItem;
import com.smartfnb.payment.domain.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation của InvoiceRepository.
 * Chuyển đổi giữa Domain Entity Invoice và JPA Entity InvoiceJpaEntity.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
@Component
@RequiredArgsConstructor
public class InvoiceRepositoryImpl implements InvoiceRepository {

    private final InvoiceJpaRepository jpaRepository;

    @Override
    public Invoice save(Invoice invoice) {
        InvoiceJpaEntity entity = toJpaEntity(invoice);
        InvoiceJpaEntity saved = jpaRepository.save(entity);
        return toDomainEntity(saved);
    }

    @Override
    public Optional<Invoice> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomainEntity);
    }

    @Override
    public Optional<Invoice> findByOrderId(UUID orderId) {
        return jpaRepository.findByOrderId(orderId).map(this::toDomainEntity);
    }

    @Override
    public Optional<Invoice> findByInvoiceNumber(String invoiceNumber) {
        return jpaRepository.findByInvoiceNumber(invoiceNumber).map(this::toDomainEntity);
    }

    @Override
    public boolean existsByInvoiceNumber(String invoiceNumber) {
        return jpaRepository.existsByInvoiceNumber(invoiceNumber);
    }

    /**
     * Chuyển đổi từ JPA Entity sang Domain Entity.
     */
    private Invoice toDomainEntity(InvoiceJpaEntity entity) {
        List<InvoiceItem> items = entity.getItems().stream()
            .map(this::toDomainInvoiceItem)
            .toList();

        return Invoice.reconstruct(
            entity.getId(),
            entity.getTenantId(),
            entity.getBranchId(),
            entity.getOrderId(),
            entity.getPaymentId(),
            entity.getInvoiceNumber(),
            entity.getSubtotal(),
            entity.getDiscount(),
            entity.getTaxAmount(),
            entity.getTotal(),
            entity.getIssuedAt(),
            items
        );
    }

    /**
     * Chuyển đổi từ JPA InvoiceItem sang Domain InvoiceItem.
     */
    private InvoiceItem toDomainInvoiceItem(InvoiceItemJpaEntity entity) {
        return InvoiceItem.reconstruct(
            entity.getId(),
            entity.getInvoice().getId(),
            entity.getItemName(),
            entity.getQuantity(),
            entity.getUnitPrice(),
            entity.getTotalPrice()
        );
    }

    /**
     * Chuyển đổi từ Domain Entity sang JPA Entity.
     */
    private InvoiceJpaEntity toJpaEntity(Invoice domain) {
        InvoiceJpaEntity entity = new InvoiceJpaEntity();
        entity.setId(domain.getId());
        entity.setTenantId(domain.getTenantId());
        entity.setBranchId(domain.getBranchId());
        entity.setOrderId(domain.getOrderId());
        entity.setPaymentId(domain.getPaymentId());
        entity.setInvoiceNumber(domain.getInvoiceNumber());
        entity.setSubtotal(domain.getSubtotal());
        entity.setDiscount(domain.getDiscount());
        entity.setTaxAmount(domain.getTaxAmount());
        entity.setTotal(domain.getTotal());
        entity.setIssuedAt(domain.getIssuedAt());

        List<InvoiceItemJpaEntity> itemEntities = domain.getItems().stream()
            .map(item -> toJpaInvoiceItem(item, entity))
            .toList();

        entity.setItems(itemEntities);
        return entity;
    }

    /**
     * Chuyển đổi từ Domain InvoiceItem sang JPA InvoiceItem.
     */
    private InvoiceItemJpaEntity toJpaInvoiceItem(InvoiceItem item, InvoiceJpaEntity invoiceEntity) {
        InvoiceItemJpaEntity itemEntity = new InvoiceItemJpaEntity();
        itemEntity.setId(item.getId());
        itemEntity.setInvoice(invoiceEntity);
        itemEntity.setItemName(item.getItemName());
        itemEntity.setQuantity(item.getQuantity());
        itemEntity.setUnitPrice(item.getUnitPrice());
        itemEntity.setTotalPrice(item.getTotalPrice());
        return itemEntity;
    }
}
