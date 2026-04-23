package com.smartfnb.forecast.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository đọc ai_series_registry — không dùng trực tiếp, JOIN qua ForecastResult.
 *
 * @author Hoàng
 * @since 2026-04-23
 */
@Repository
public interface AiSeriesRegistryJpaRepository extends JpaRepository<AiSeriesRegistryJpaEntity, Long> {
}
