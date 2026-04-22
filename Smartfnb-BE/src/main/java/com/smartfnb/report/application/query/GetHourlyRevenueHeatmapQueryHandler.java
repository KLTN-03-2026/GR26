package com.smartfnb.report.application.query;

import com.smartfnb.report.application.dto.HourlyRevenueHeatmapResult;
import com.smartfnb.report.infrastructure.persistence.HourlyRevenueStatJpaRepository;
import com.smartfnb.report.infrastructure.persistence.HourlyRevenueStatJpaEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * QueryHandler: Lấy heatmap doanh thu theo giờ.
 * Dữ liệu dùng để render biểu đồ theo giờ (0-23) trong ngày.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetHourlyRevenueHeatmapQueryHandler {
    
    private final HourlyRevenueStatJpaRepository hourlyRevenueStatRepo;
    private final com.smartfnb.report.infrastructure.persistence.ReportDataAccessor reportDataAccessor;
    
    public HourlyRevenueHeatmapResult handle(GetHourlyRevenueHeatmapQuery query) {
        log.info("Lấy heatmap doanh thu: branchId={}, date={}", query.branchId(), query.date());
        
        List<HourlyRevenueStatJpaEntity> hourlyData =
            hourlyRevenueStatRepo.findByBranchIdAndDateOrderByHour(query.branchId(), query.date());
        
        List<HourlyRevenueHeatmapResult.HourlyDataDto> heatmapData = hourlyData.stream()
            .map(entity -> {
                BigDecimal avgOrderValue = entity.getOrderCount() > 0 ?
                    entity.getRevenue().divide(new BigDecimal(entity.getOrderCount()), 2, java.math.RoundingMode.HALF_UP) :
                    BigDecimal.ZERO;
                
                return new HourlyRevenueHeatmapResult.HourlyDataDto(
                    entity.getHour(),
                    entity.getOrderCount(),
                    entity.getRevenue(),
                    avgOrderValue
                );
            })
            .collect(Collectors.toList());
        
        // Nếu không có dữ liệu, fill các giờ từ 0-23 với 0
        if (heatmapData.isEmpty()) {
            heatmapData = new ArrayList<>();
            for (int hour = 0; hour <= 23; hour++) {
                heatmapData.add(new HourlyRevenueHeatmapResult.HourlyDataDto(
                    hour, 0, BigDecimal.ZERO, BigDecimal.ZERO
                ));
            }
        }
        
        return new HourlyRevenueHeatmapResult(
            query.date(),
            reportDataAccessor.getBranchName(query.branchId()).orElse("Unknown"),
            heatmapData
        );
    }
}
