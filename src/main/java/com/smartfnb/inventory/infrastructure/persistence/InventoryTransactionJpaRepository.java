package com.smartfnb.inventory.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Spring Data JPA Repository cho inventory_transactions.
 * Chỉ INSERT — không UPDATE (audit trail bất biến).
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
@Repository
public interface InventoryTransactionJpaRepository
        extends JpaRepository<InventoryTransactionJpaEntity, UUID> {
    // Chỉ dùng save() để ghi log — không có query đặc biệt vì là write-only
}
