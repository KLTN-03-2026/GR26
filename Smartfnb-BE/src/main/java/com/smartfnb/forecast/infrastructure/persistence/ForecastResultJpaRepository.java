package com.smartfnb.forecast.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/**
 * Repository đọc forecast_results — JOIN với ai_series_registry để filter theo tenant/branch.
 * Mọi query PHẢI có tenantId filter để đảm bảo multi-tenant isolation.
 *
 * @author Hoàng
 * @since 2026-04-23
 */
@Repository
public interface ForecastResultJpaRepository extends JpaRepository<ForecastResultJpaEntity, Long> {

    /**
     * Lấy toàn bộ kết quả dự báo của 1 chi nhánh từ hôm nay trở đi.
     * JOIN qua ai_series_registry để lấy đúng tenant/branch.
     *
     * @param branchId  UUID chi nhánh (string)
     * @param tenantId  UUID tenant (string) — BẮT BUỘC cho multi-tenant
     * @return danh sách forecast, order theo ingredient rồi theo ngày
     */
    @Query("""
            SELECT f FROM ForecastResultJpaEntity f
            WHERE f.series.branchId = :branchId
              AND f.series.tenantId = :tenantId
              AND f.forecastDate >= CURRENT_DATE
            ORDER BY f.series.ingredientId ASC, f.forecastDate ASC
            """)
    List<ForecastResultJpaEntity> findForecastByBranch(
            @Param("branchId") String branchId,
            @Param("tenantId") String tenantId);

    /**
     * Lấy kết quả dự báo cho 1 nguyên liệu cụ thể của chi nhánh.
     *
     * @param branchId     UUID chi nhánh (string)
     * @param tenantId     UUID tenant (string)
     * @param ingredientId UUID nguyên liệu (string)
     * @return danh sách forecast theo ngày tăng dần
     */
    @Query("""
            SELECT f FROM ForecastResultJpaEntity f
            WHERE f.series.branchId = :branchId
              AND f.series.tenantId = :tenantId
              AND f.series.ingredientId = :ingredientId
              AND f.forecastDate >= CURRENT_DATE
            ORDER BY f.forecastDate ASC
            """)
    List<ForecastResultJpaEntity> findForecastByIngredient(
            @Param("branchId") String branchId,
            @Param("tenantId") String tenantId,
            @Param("ingredientId") String ingredientId);

    /**
     * Đếm số nguyên liệu phân theo mức độ cấp bách cho 1 chi nhánh.
     * Dùng native query để GROUP BY, trả về List<Object[]> gồm [urgency, count].
     *
     * @param branchId UUID chi nhánh (string)
     * @param tenantId UUID tenant (string)
     * @return list các row [urgency, count]
     */
    @Query(value = """
            SELECT fr.urgency, COUNT(DISTINCT asr.ingredient_id) AS cnt
            FROM forecast_results fr
            JOIN ai_series_registry asr ON fr.series_id = asr.id
            WHERE asr.branch_id = :branchId
              AND asr.tenant_id = :tenantId
              AND fr.forecast_date = CURRENT_DATE
            GROUP BY fr.urgency
            """, nativeQuery = true)
    List<Object[]> countByUrgency(
            @Param("branchId") String branchId,
            @Param("tenantId") String tenantId);
}
