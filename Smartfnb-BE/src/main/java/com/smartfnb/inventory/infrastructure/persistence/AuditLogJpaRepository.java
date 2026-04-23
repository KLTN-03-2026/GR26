package com.smartfnb.inventory.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Spring Data JPA Repository cho audit_logs.
 * Write-only — mọi audit log đều là bất biến sau khi tạo.
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
@Repository
public interface AuditLogJpaRepository
        extends JpaRepository<AuditLogJpaEntity, UUID> {
    // Chỉ dùng save() — không có query đặc biệt ở tầng này
}
