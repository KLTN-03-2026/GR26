package com.smartfnb.staff.infrastructure.persistence;

import com.smartfnb.inventory.infrastructure.persistence.AuditLogJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * JPA Repository cho bảng audit_logs — dùng trong Staff module.
 * Reuse entity AuditLogJpaEntity từ inventory module (cùng bảng audit_logs).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public interface StaffAuditLogJpaRepository extends JpaRepository<AuditLogJpaEntity, UUID> {
}
