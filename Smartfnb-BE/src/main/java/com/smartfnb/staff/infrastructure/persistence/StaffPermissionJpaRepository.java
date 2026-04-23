package com.smartfnb.staff.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * JPA Repository cho bảng permissions (seed data — chỉ đọc).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public interface StaffPermissionJpaRepository extends JpaRepository<PermissionJpaEntity, String> {

    /**
     * Lấy tất cả permissions theo module.
     *
     * @param module Tên module: POS, HR, INVENTORY...
     * @return Danh sách permissions
     */
    List<PermissionJpaEntity> findByModule(String module);
}
