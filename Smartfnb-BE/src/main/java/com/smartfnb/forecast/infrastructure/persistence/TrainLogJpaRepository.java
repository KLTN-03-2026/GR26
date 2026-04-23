package com.smartfnb.forecast.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository đọc train_logs để lấy thông tin lần train gần nhất.
 *
 * @author Hoàng
 * @since 2026-04-23
 */
@Repository
public interface TrainLogJpaRepository extends JpaRepository<TrainLogJpaEntity, Long> {

    /**
     * Lấy log train thành công mới nhất của 1 tenant (global model).
     * Branch_id có thể null nếu model là global cho cả tenant.
     *
     * @param tenantId UUID tenant (string)
     * @return log mới nhất nếu có
     */
    @Query("""
            SELECT t FROM TrainLogJpaEntity t
            WHERE t.tenantId = :tenantId
              AND t.status = 'SUCCESS'
            ORDER BY t.finishedAt DESC
            LIMIT 1
            """)
    Optional<TrainLogJpaEntity> findLatestSuccessfulByTenant(
            @Param("tenantId") String tenantId);

    /**
     * Lấy log train thành công mới nhất của 1 chi nhánh cụ thể.
     *
     * @param tenantId UUID tenant (string)
     * @param branchId UUID chi nhánh (string)
     * @return log mới nhất nếu có
     */
    @Query("""
            SELECT t FROM TrainLogJpaEntity t
            WHERE t.tenantId = :tenantId
              AND t.branchId = :branchId
              AND t.status = 'SUCCESS'
            ORDER BY t.finishedAt DESC
            LIMIT 1
            """)
    Optional<TrainLogJpaEntity> findLatestSuccessfulByTenantAndBranch(
            @Param("tenantId") String tenantId,
            @Param("branchId") String branchId);

    /**
     * Lấy log train bất kỳ (kể cả FAILED) mới nhất của tenant để hiển thị trạng thái.
     *
     * @param tenantId UUID tenant (string)
     * @return log mới nhất nếu có
     */
    Optional<TrainLogJpaEntity> findTopByTenantIdOrderByFinishedAtDesc(String tenantId);
}
