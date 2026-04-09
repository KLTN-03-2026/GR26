package com.smartfnb.branch.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BranchUserJpaRepository extends JpaRepository<BranchUserJpaEntity, BranchUserId> {

    /**
     * Lấy tất cả chi nhánh mà nhân viên đang được phân công.
     */
    List<BranchUserJpaEntity> findByUserId(UUID userId);

    /**
     * Lấy danh sách nhân viên của 1 chi nhánh.
     */
    List<BranchUserJpaEntity> findByBranchId(UUID branchId);
    
    /**
     * Kiểm tra user có thuộc branch không
     */
    boolean existsByBranchIdAndUserId(UUID branchId, UUID userId);

    Optional<BranchUserJpaEntity> findByBranchIdAndUserId(UUID branchId, UUID userId);
}
