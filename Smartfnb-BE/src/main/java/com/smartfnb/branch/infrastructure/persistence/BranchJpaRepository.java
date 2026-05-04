package com.smartfnb.branch.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BranchJpaRepository extends JpaRepository<BranchJpaEntity, UUID> {
    
    /**
     * Đếm số chi nhánh hiện có của 1 Tenant (để validate tổng quát).
     */
    long countByTenantId(UUID tenantId);

    /**
     * Đếm số chi nhánh theo trạng thái.
     */
    long countByTenantIdAndStatus(UUID tenantId, String status);

    /**
     * Lấy danh sách toàn bộ chi nhánh của Tenant theo trạng thái.
     */
    List<BranchJpaEntity> findByTenantIdAndStatus(UUID tenantId, String status);


    
  /**
   * Lấy toàn bộ chi nhánh thuộc tenant để đồng bộ trạng thái món theo chi nhánh.
   */
    List<BranchJpaEntity> findByTenantId(UUID tenantId);
}
