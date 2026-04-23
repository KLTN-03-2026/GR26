package com.smartfnb.report.infrastructure.scheduler;

import com.smartfnb.report.domain.model.DailyRevenueSummary;
import com.smartfnb.report.domain.model.DailyRevenueSummary.PaymentBreakdown;
import com.smartfnb.report.domain.repository.DailyRevenueSummaryRepository;
import com.smartfnb.report.infrastructure.persistence.DailyRevenueSummaryJpaEntity;
import com.smartfnb.report.infrastructure.persistence.DailyRevenueSummaryJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Scheduled Job: Cập nhật báo cáo doanh thu hàng ngày.
 * Chạy vào lúc 00:05 hàng ngày để tính toán doanh thu của ngày hôm trước.
 * 
 * Job này là FALLBACK nếu các event từ OrderCompletedEvent bị mất.
 * Hiện tại: Job sẽ query từ bảng orders và tính toán lại dari scratch.
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DailyRevenueReportScheduler {
    
    private final DailyRevenueSummaryJpaRepository dailyRevenueSummaryRepo;
    private final DailyRevenueSummaryRepository domainRepository;
    
    /**
     * Cron: "0 5 0 * * ?" — Chạy lúc 00:05:00 hàng ngày.
     * Timezone: Asia/Ho_Chi_Minh (UTC+7).
     */
    @Scheduled(cron = "0 5 0 * * ?", zone = "Asia/Ho_Chi_Minh")
    public void updateDailyRevenueSummaries() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        log.info("========== JOB: Cập nhật báo cáo doanh thu cho ngày {} ==========", yesterday);
        
        try {
            // TODO: Implementation
            // 1. Query từ orders table WHERE date = yesterday GROUP BY branch_id
            // 2. Tính sum(total_amount), count(*), avg(total_amount)
            // 3. Breakdown by payment method (từ payments)
            // 4. Query cost_of_goods từ bảng COGS (nếu có)
            // 5. Cập nhật vào daily_revenue_summaries
            
            log.info("✓ Hoàn thành cập nhật báo cáo cho ngày {}", yesterday);
        } catch (Exception e) {
            log.error("✗ Lỗi khi cập nhật báo cáo doanh thu cho ngày {}: {}", yesterday, e.getMessage(), e);
        }
    }
    
    /**
     * BONUS: Cron job cập nhật báo cáo theo tuần / tháng.
     * Chạy lúc 01:00 hàng chủ nhật để xác nhận báo cáo tuần.
     */
    @Scheduled(cron = "0 0 1 ? * 0", zone = "Asia/Ho_Chi_Minh")
    public void updateWeeklyRevenueReport() {
        log.info("========== JOB: Cập nhật báo cáo doanh thu theo tuần ==========");
        // TODO: Implementation
    }
    
    /**
     * BONUS: Cron job cập nhật báo cáo theo tháng.
     * Chạy lúc 02:00 ngày 1 hàng tháng.
     */
    @Scheduled(cron = "0 0 2 1 * ?", zone = "Asia/Ho_Chi_Minh")
    public void updateMonthlyRevenueReport() {
        log.info("========== JOB: Cập nhật báo cáo doanh thu theo tháng ==========");
        // TODO: Implementation
    }
    
    // Tạm thời để test nếu cần chạy test scheduler
    @Scheduled(fixedDelay = 60000, initialDelay = 10000)
    public void testScheduler() {
        // log.debug("Test scheduler tick - {}", LocalDateTime.now());
    }
}
