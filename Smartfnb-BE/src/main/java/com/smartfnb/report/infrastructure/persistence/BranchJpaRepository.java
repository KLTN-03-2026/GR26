package com.smartfnb.report.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Simple repository để lấy thông tin branch (dùng cho report module).
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Repository
public interface BranchJpaRepository extends JpaRepository<Object, UUID> {
    // Sẽ được implement bởi Spring Data JPA
    // Để query từ bảng branches
}
