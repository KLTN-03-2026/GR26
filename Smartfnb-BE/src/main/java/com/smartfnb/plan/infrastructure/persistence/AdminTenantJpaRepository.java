package com.smartfnb.plan.infrastructure.persistence;

import com.smartfnb.auth.infrastructure.persistence.TenantJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository JPA dành cho SYSTEM_ADMIN quản lý Tenant.
 * Kế thừa JpaSpecificationExecutor để hỗ trợ filter động
 * (status, planId, keyword) qua TenantSpecification.
 *
 * @author vutq
 * @since 2026-04-24
 */
@Repository
public interface AdminTenantJpaRepository
        extends JpaRepository<TenantJpaEntity, UUID>,
                JpaSpecificationExecutor<TenantJpaEntity> {

    /**
     * Kiểm tra tenant có tồn tại với email nhất định không.
     * Dùng để validate khi sửa thông tin tenant.
     */
    boolean existsByEmailAndIdNot(String email, UUID excludedId);
}
