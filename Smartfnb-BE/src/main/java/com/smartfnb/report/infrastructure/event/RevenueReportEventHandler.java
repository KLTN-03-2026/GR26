package com.smartfnb.report.infrastructure.event;

import com.smartfnb.report.domain.model.DailyRevenueSummary;
import com.smartfnb.report.domain.model.DailyRevenueSummary.PaymentBreakdown;
import com.smartfnb.report.domain.model.DailyItemStat;
import com.smartfnb.report.domain.model.HourlyRevenueStat;
import com.smartfnb.report.domain.event.RevenueReportUpdatedEvent;
import com.smartfnb.report.domain.repository.DailyRevenueSummaryRepository;
import com.smartfnb.report.domain.repository.DailyItemStatRepository;
import com.smartfnb.report.domain.repository.HourlyRevenueStatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Event Listener: Xử lý OrderCompletedEvent từ Order module.
 * Cập nhật:
 * - daily_revenue_summaries (doanh thu hàng ngày)
 * - daily_item_stats (hiệu suất sản phẩm)
 * - hourly_revenue_stats (doanh thu theo giờ)
 *
 * @author SmartF&B Team
 * @since 2026-04-16
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RevenueReportEventHandler {
    
    private final DailyRevenueSummaryRepository dailyRevenueSummaryRepo;
    private final DailyItemStatRepository dailyItemStatRepo;
    private final HourlyRevenueStatRepository hourlyRevenueStatRepo;
    
    /**
     * Xử lý sự kiện OrderCompletedEvent.
     * Cập nhật báo cáo doanh thu realtime.
     */
    @EventListener
    public void onOrderCompleted(com.smartfnb.order.domain.event.OrderCompletedEvent event) {
        log.info("📊 Nhận sự kiện OrderCompletedEvent: orderId={}, amount={}", event.orderId(), event.totalAmount());
        
        try {
            LocalDateTime occurredAt = Instant.ofEpochMilli(event.occurredAt().toEpochMilli())
                .atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                .toLocalDateTime();
            LocalDate date = occurredAt.toLocalDate();
            int hour = occurredAt.getHour();
            
            // 1. Cập nhật DailyRevenueSummary
            // NOTE: orderCompletedEvent không có paymentMethod; sẽ được cập nhật từ Order entity riêng
            updateDailyRevenueSummary(event.tenantId(), event.branchId(), date, event.totalAmount());
            
            // 2. Cập nhật DailyItemStats cho từng item trong đơn
            if (event.items() != null) {
                for (var item : event.items()) {
                    updateDailyItemStat(
                        event.tenantId(),
                        event.branchId(),
                        item.menuItemId(),
                        date,
                        item.quantity(),
                        item.unitPrice().multiply(new BigDecimal(item.quantity()))
                    );
                }
            }
            
            // 3. Cập nhật HourlyRevenueStat
            updateHourlyRevenueStat(event.branchId(), date, hour, 1, event.totalAmount());
            
            log.info("✓ Cập nhật báo cáo doanh thu thành công cho đơn {}", event.orderNumber());
        } catch (Exception e) {
            log.error("✗ Lỗi khi cập nhật báo cáo: {}", e.getMessage(), e);
        }
    }

    /**
     * Xử lý sự kiện PaymentCompletedEvent.
     * Cập nhật payment_breakdown theo đúng phương thức thanh toán (CASH/MOMO/VIETQR/BANKING).
     *
     * <p>BUG FIX: Trước đây handler này bị thiếu, nên payment_breakdown.cash mãi = 0
     * dù đã có đơn tiền mặt hoàn tất.</p>
     */
    @EventListener
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        log.info("Nhận PaymentCompletedEvent: paymentId={}, method={}, amount={}",
            event.paymentId(), event.paymentMethod(), event.amount());

        try {
            LocalDate date = event.occurredAt()
                .atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                .toLocalDate();

            updatePaymentBreakdown(event.tenantId(), event.branchId(), date,
                event.paymentMethod(), event.amount());

            log.info("Cập nhật payment_breakdown.{} += {} thành công",
                event.paymentMethod().toLowerCase(), event.amount());
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật payment breakdown: {}", e.getMessage(), e);
        }
    }

    /**
     * Cập nhật đúng field trong payment_breakdown theo paymentMethod.
     */
    private void updatePaymentBreakdown(UUID tenantId, UUID branchId, LocalDate date,
                                        String paymentMethod, BigDecimal amount) {
        Optional<DailyRevenueSummary> existing = dailyRevenueSummaryRepo.findByBranchIdAndDate(branchId, date);

        if (existing.isEmpty()) {
            // Không có summary: không tự tạo mới ở đây (OrderCompletedEvent sẽ tạo trước)
            log.warn("Không tìm thấy DailyRevenueSummary để cập nhật breakdown: branch={}, date={}", branchId, date);
            return;
        }

        DailyRevenueSummary old = existing.get();
        PaymentBreakdown oldBreakdown = old.paymentBreakdown() != null
            ? old.paymentBreakdown()
            : new PaymentBreakdown(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);

        // Cập nhật đúng field theo method
        PaymentBreakdown newBreakdown = switch (paymentMethod) {
            case "CASH"    -> new PaymentBreakdown(
                                    oldBreakdown.cash().add(amount),
                                    oldBreakdown.momo(), oldBreakdown.vietqr(),
                                    oldBreakdown.banking(), oldBreakdown.other());
            case "MOMO"    -> new PaymentBreakdown(
                                    oldBreakdown.cash(),
                                    oldBreakdown.momo().add(amount),
                                    oldBreakdown.vietqr(), oldBreakdown.banking(), oldBreakdown.other());
            case "VIETQR"  -> new PaymentBreakdown(
                                    oldBreakdown.cash(), oldBreakdown.momo(),
                                    oldBreakdown.vietqr().add(amount),
                                    oldBreakdown.banking(), oldBreakdown.other());
            case "BANKING" -> new PaymentBreakdown(
                                    oldBreakdown.cash(), oldBreakdown.momo(), oldBreakdown.vietqr(),
                                    oldBreakdown.banking().add(amount),
                                    oldBreakdown.other());
            default        -> new PaymentBreakdown(
                                    oldBreakdown.cash(), oldBreakdown.momo(), oldBreakdown.vietqr(),
                                    oldBreakdown.banking(),
                                    oldBreakdown.other().add(amount));
        };

        DailyRevenueSummary updated = new DailyRevenueSummary(
            old.id(), old.tenantId(), old.branchId(), old.date(),
            old.totalRevenue(), old.totalOrders(), old.avgOrderValue(),
            newBreakdown,
            old.costOfGoods(), old.grossProfit()
        );
        dailyRevenueSummaryRepo.save(updated);
    }
    
    private void updateDailyRevenueSummary(UUID tenantId, UUID branchId, LocalDate date,
                                          BigDecimal amount) {
        Optional<DailyRevenueSummary> existing = dailyRevenueSummaryRepo.findByBranchIdAndDate(branchId, date);
        
        DailyRevenueSummary summary;
        if (existing.isPresent()) {
            DailyRevenueSummary old = existing.get();
            BigDecimal newRevenue = old.totalRevenue().add(amount);
            int newOrders = old.totalOrders() + 1;
            BigDecimal newAvgOrderValue = newRevenue.divide(new BigDecimal(newOrders), 2, java.math.RoundingMode.HALF_UP);
            
            // Giữ payment breakdown cũ (payment method được track riêng từ Order entity)
            PaymentBreakdown oldBreakdown = old.paymentBreakdown() != null ?
                old.paymentBreakdown() :
                new PaymentBreakdown(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
            
            summary = new DailyRevenueSummary(
                old.id(), tenantId, branchId, date,
                newRevenue, newOrders, newAvgOrderValue,
                oldBreakdown,
                old.costOfGoods(),
                newRevenue.subtract(old.costOfGoods())
            );
        } else {
            // Tạo breakdown mới với tất cả 0 (sẽ được update từ Order entity)
            PaymentBreakdown breakdown = new PaymentBreakdown(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
            );
            summary = new DailyRevenueSummary(
                UUID.randomUUID(), tenantId, branchId, date,
                amount, 1, amount,
                breakdown,
                BigDecimal.ZERO,
                amount
            );
        }
        
        dailyRevenueSummaryRepo.save(summary);
    }
    
    private void updateDailyItemStat(UUID tenantId, UUID branchId, UUID itemId, LocalDate date,
                                     int qtySold, BigDecimal revenue) {
        Optional<DailyItemStat> existing = dailyItemStatRepo.findByBranchIdItemIdAndDate(branchId, itemId, date);
        
        DailyItemStat stat;
        if (existing.isPresent()) {
            DailyItemStat old = existing.get();
            int newQty = old.qtySold() + qtySold;
            BigDecimal newRevenue = old.revenue().add(revenue);
            BigDecimal newCost = old.cost();  // TODO: Lấy cost từ recipe mapping
            BigDecimal newMargin = newRevenue.compareTo(BigDecimal.ZERO) > 0 ?
                newRevenue.subtract(newCost)
                    .divide(newRevenue, 2, java.math.RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")) :
                BigDecimal.ZERO;
            
            stat = new DailyItemStat(
                old.id(), tenantId, branchId, itemId, old.itemName(),
                date, newQty, newRevenue, newCost, newMargin
            );
        } else {
            stat = new DailyItemStat(
                UUID.randomUUID(), tenantId, branchId, itemId, "",
                date, qtySold, revenue, BigDecimal.ZERO, BigDecimal.ZERO
            );
        }
        
        dailyItemStatRepo.save(stat);
    }
    
    private void updateHourlyRevenueStat(UUID branchId, LocalDate date, int hour,
                                        int orderCount, BigDecimal revenue) {
        Optional<HourlyRevenueStat> existing = hourlyRevenueStatRepo.findByBranchIdDateAndHour(branchId, date, hour);
        
        HourlyRevenueStat stat;
        if (existing.isPresent()) {
            HourlyRevenueStat old = existing.get();
            stat = new HourlyRevenueStat(
                old.id(), branchId, date, hour,
                old.orderCount() + orderCount,
                old.revenue().add(revenue)
            );
        } else {
            stat = new HourlyRevenueStat(
                UUID.randomUUID(), branchId, date, hour,
                orderCount, revenue
            );
        }
        
        hourlyRevenueStatRepo.save(stat);
    }

    /**
     * Xử lý sự kiện PaymentCompletedEvent.
     * Cập nhật breakdown hình thức thanh toán báo cáo doanh thu.
     */
    @EventListener
    public void onPaymentCompleted(com.smartfnb.payment.domain.event.PaymentCompletedEvent event) {
        log.info("📊 Nhận sự kiện PaymentCompletedEvent: paymentId={}, method={}, amount={}", 
            event.paymentId(), event.paymentMethod(), event.amount());
        
        try {
            LocalDateTime occurredAt = Instant.ofEpochMilli(event.occurredAt().toEpochMilli())
                .atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                .toLocalDateTime();
            LocalDate date = occurredAt.toLocalDate();
            
            updatePaymentBreakdown(event.tenantId(), event.branchId(), date, event.amount(), event.paymentMethod());
            log.info("✓ Cập nhật payment breakdown thành công cho đơn {}", event.orderNumber());
        } catch (Exception e) {
            log.error("✗ Lỗi khi cập nhật payment breakdown: {}", e.getMessage(), e);
        }
    }

    private void updatePaymentBreakdown(UUID tenantId, UUID branchId, LocalDate date, BigDecimal amount, String method) {
        Optional<DailyRevenueSummary> existing = dailyRevenueSummaryRepo.findByBranchIdAndDate(branchId, date);
        
        DailyRevenueSummary summary;
        if (existing.isPresent()) {
            DailyRevenueSummary old = existing.get();
            PaymentBreakdown oldBreakdown = old.paymentBreakdown() != null ?
                old.paymentBreakdown() :
                new PaymentBreakdown(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
            
            BigDecimal cash = oldBreakdown.cash() != null ? oldBreakdown.cash() : BigDecimal.ZERO;
            BigDecimal momo = oldBreakdown.momo() != null ? oldBreakdown.momo() : BigDecimal.ZERO;
            BigDecimal vietqr = oldBreakdown.vietqr() != null ? oldBreakdown.vietqr() : BigDecimal.ZERO;
            BigDecimal banking = oldBreakdown.banking() != null ? oldBreakdown.banking() : BigDecimal.ZERO;
            BigDecimal other = oldBreakdown.other() != null ? oldBreakdown.other() : BigDecimal.ZERO;

            if ("CASH".equalsIgnoreCase(method)) cash = cash.add(amount);
            else if ("MOMO".equalsIgnoreCase(method)) momo = momo.add(amount);
            else if ("VIETQR".equalsIgnoreCase(method)) vietqr = vietqr.add(amount);
            else if ("BANKING".equalsIgnoreCase(method)) banking = banking.add(amount);
            else other = other.add(amount); // ZALOPAY and others go here

            PaymentBreakdown newBreakdown = new PaymentBreakdown(cash, momo, vietqr, banking, other);
            
            summary = new DailyRevenueSummary(
                old.id(), old.tenantId(), old.branchId(), old.date(),
                old.totalRevenue(), old.totalOrders(), old.avgOrderValue(),
                newBreakdown,
                old.costOfGoods(),
                old.grossProfit()
            );
        } else {
            BigDecimal cash = BigDecimal.ZERO;
            BigDecimal momo = BigDecimal.ZERO;
            BigDecimal vietqr = BigDecimal.ZERO;
            BigDecimal banking = BigDecimal.ZERO;
            BigDecimal other = BigDecimal.ZERO;

            if ("CASH".equalsIgnoreCase(method)) cash = amount;
            else if ("MOMO".equalsIgnoreCase(method)) momo = amount;
            else if ("VIETQR".equalsIgnoreCase(method)) vietqr = amount;
            else if ("BANKING".equalsIgnoreCase(method)) banking = amount;
            else other = amount; // ZALOPAY and others go here

            PaymentBreakdown breakdown = new PaymentBreakdown(cash, momo, vietqr, banking, other);
            summary = new DailyRevenueSummary(
                UUID.randomUUID(), tenantId, branchId, date,
                BigDecimal.ZERO, 0, BigDecimal.ZERO,
                breakdown,
                BigDecimal.ZERO,
                BigDecimal.ZERO
            );
        }
        
        dailyRevenueSummaryRepo.save(summary);
    }
}
