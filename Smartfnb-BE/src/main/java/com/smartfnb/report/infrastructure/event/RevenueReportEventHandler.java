package com.smartfnb.report.infrastructure.event;

import com.smartfnb.report.domain.model.DailyRevenueSummary;
import com.smartfnb.report.domain.model.DailyRevenueSummary.PaymentBreakdown;
import com.smartfnb.report.domain.model.DailyItemStat;
import com.smartfnb.report.domain.model.HourlyRevenueStat;
import com.smartfnb.report.domain.repository.DailyRevenueSummaryRepository;
import com.smartfnb.report.domain.repository.DailyItemStatRepository;
import com.smartfnb.report.domain.repository.HourlyRevenueStatRepository;
import com.smartfnb.payment.domain.event.PaymentCompletedEvent;
import com.smartfnb.inventory.domain.event.OrderCostCalculatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

/**
 * Event Listener: Xử lý OrderCompletedEvent từ Order module.
 * Cập nhật:
 * - daily_revenue_summaries (doanh thu hàng ngày)
 * - daily_item_stats (hiệu suất sản phẩm)
 * - hourly_revenue_stats (doanh thu theo giờ)
 *
 * @author vutq
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
        log.info("Nhận sự kiện OrderCompletedEvent: orderId={}, amount={}", event.orderId(), event.totalAmount());
        
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
                        item.itemName(),
                        date,
                        item.quantity(),
                        item.unitPrice().multiply(new BigDecimal(item.quantity()))
                    );
                }
            }
            
            // 3. Cập nhật HourlyRevenueStat
            updateHourlyRevenueStat(event.branchId(), date, hour, 1, event.totalAmount());
            
            log.info("Cập nhật báo cáo doanh thu thành công cho đơn {}", event.orderNumber());
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật báo cáo: {}", e.getMessage(), e);
        }
    }

    /**
     * Xử lý sự kiện PaymentCompletedEvent.
     * Cập nhật payment_breakdown theo đúng phương thức thanh toán (CASH/MOMO/VIETQR/BANKING).
     *
     * author: Hoàng | date: 27-04-2026 | note: Chuyển từ @EventListener sang @TransactionalEventListener
     *   AFTER_COMMIT để tránh Hibernate auto-flush khi đang trong cùng transaction với handler.
     *   Vấn đề gốc: @EventListener chạy trong cùng transaction → findByBranchIdAndDate() trigger
     *   auto-flush pending invoice INSERT → DUPLICATE KEY → rollback toàn bộ.
     *   AFTER_COMMIT đảm bảo event chỉ được xử lý SAU KHI transaction gốc commit thành công.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        log.info("Nhận sự kiện PaymentCompletedEvent: paymentId={}, method={}, amount={}",
            event.paymentId(), event.paymentMethod(), event.amount());

        try {
            LocalDate date = event.occurredAt()
                .atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                .toLocalDate();

            updatePaymentBreakdown(event.tenantId(), event.branchId(), date, event.paymentMethod(), event.amount());

            log.info("✓ Cập nhật payment_breakdown.{} += {} thành công",
                event.paymentMethod().toLowerCase(), event.amount());
        } catch (Exception e) {
            log.error("✗ Lỗi khi cập nhật payment breakdown: {}", e.getMessage(), e);
        }
    }

    /**
     * Lắng nghe sự kiện OrderCostCalculatedEvent từ Inventory Module.
     * Author: Hoàng
     * Date: 2026-05-09
     * Note: Cập nhật COGS bằng listener thường để event phát từ async inventory không bị bỏ qua ở AFTER_COMMIT.
     */
    @EventListener
    public void onOrderCostCalculated(OrderCostCalculatedEvent event) {
        log.info("Nhận sự kiện OrderCostCalculatedEvent: orderId={}, branch={}, date={}, totalCost={}",
            event.orderId(), event.branchId(), event.date(), event.totalCost());
        
        try {
            // Author: Hoàng | Date: 2026-05-09 | Note: Cập nhật COGS ngay trong luồng event để tránh bỏ sót giá vốn khi async transaction đã có SALE_DEDUCT.
            Optional<DailyRevenueSummary> existing = dailyRevenueSummaryRepo.findByBranchIdAndDate(event.branchId(), event.date());
            DailyRevenueSummary summary;
            BigDecimal eventTotalCost = event.totalCost() != null ? event.totalCost() : BigDecimal.ZERO;
            
            if (existing.isPresent()) {
                DailyRevenueSummary old = existing.get();
                BigDecimal oldCostOfGoods = old.costOfGoods() != null ? old.costOfGoods() : BigDecimal.ZERO;
                BigDecimal oldTotalRevenue = old.totalRevenue() != null ? old.totalRevenue() : BigDecimal.ZERO;
                BigDecimal newCostOfGoods = oldCostOfGoods.add(eventTotalCost);
                
                summary = new DailyRevenueSummary(
                    old.id(), old.tenantId(), old.branchId(), old.date(),
                    old.totalRevenue(), old.totalOrders(), old.avgOrderValue(),
                    old.paymentBreakdown(),
                    newCostOfGoods,
                    oldTotalRevenue.subtract(newCostOfGoods)
                );
            } else {
                PaymentBreakdown breakdown = new PaymentBreakdown(
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
                );
                summary = new DailyRevenueSummary(
                    UUID.randomUUID(), event.tenantId(), event.branchId(), event.date(),
                    BigDecimal.ZERO, 0, BigDecimal.ZERO,
                    breakdown,
                    eventTotalCost,
                    BigDecimal.ZERO.subtract(eventTotalCost)
                );
            }
            
            dailyRevenueSummaryRepo.save(summary);
            updateDailyItemCosts(event);
            log.info("Cập nhật cost_of_goods thành công: orderId={}, totalCost={}", event.orderId(), eventTotalCost);
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật cost_of_goods: orderId={}, lỗi={}", event.orderId(), e.getMessage(), e);
        }
    }

    /**
     * Cập nhật đúng field trong payment_breakdown theo paymentMethod.
     */
    private void updatePaymentBreakdown(UUID tenantId, UUID branchId, LocalDate date,
                                        String paymentMethod, BigDecimal amount) {
        Optional<DailyRevenueSummary> existing = dailyRevenueSummaryRepo.findByBranchIdAndDate(branchId, date);

        DailyRevenueSummary summary;
        if (existing.isPresent()) {
            DailyRevenueSummary old = existing.get();
            PaymentBreakdown oldBreakdown = old.paymentBreakdown() != null
                ? old.paymentBreakdown()
                : new PaymentBreakdown(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);

            BigDecimal cash = oldBreakdown.cash() != null ? oldBreakdown.cash() : BigDecimal.ZERO;
            BigDecimal momo = oldBreakdown.momo() != null ? oldBreakdown.momo() : BigDecimal.ZERO;
            BigDecimal vietqr = oldBreakdown.vietqr() != null ? oldBreakdown.vietqr() : BigDecimal.ZERO;
            BigDecimal banking = oldBreakdown.banking() != null ? oldBreakdown.banking() : BigDecimal.ZERO;
            BigDecimal other = oldBreakdown.other() != null ? oldBreakdown.other() : BigDecimal.ZERO;
            BigDecimal payos = oldBreakdown.payos() != null ? oldBreakdown.payos() : BigDecimal.ZERO;

            if ("CASH".equalsIgnoreCase(paymentMethod)) cash = cash.add(amount);
            else if ("MOMO".equalsIgnoreCase(paymentMethod)) momo = momo.add(amount);
            else if ("VIETQR".equalsIgnoreCase(paymentMethod)) vietqr = vietqr.add(amount);
            else if ("BANKING".equalsIgnoreCase(paymentMethod)) banking = banking.add(amount);
            else if ("PAYOS".equalsIgnoreCase(paymentMethod)) payos = payos.add(amount);
            else other = other.add(amount);

            PaymentBreakdown newBreakdown = new PaymentBreakdown(cash, momo, vietqr, banking, other, payos);
            summary = new DailyRevenueSummary(
                old.id(), old.tenantId(), old.branchId(), old.date(),
                old.totalRevenue(), old.totalOrders(), old.avgOrderValue(),
                newBreakdown,
                old.costOfGoods(),
                old.grossProfit()
            );
        } else {
            // Trường hợp hy hữu: PaymentEvent đến trước OrderCompletedEvent
            log.warn("Không tìm thấy DailyRevenueSummary để cập nhật breakdown: branch={}, date={}. Tạo bản ghi placeholder.", branchId, date);
            BigDecimal cash = BigDecimal.ZERO;
            BigDecimal momo = BigDecimal.ZERO;
            BigDecimal vietqr = BigDecimal.ZERO;
            BigDecimal banking = BigDecimal.ZERO;
            BigDecimal other = BigDecimal.ZERO;
            BigDecimal payos = BigDecimal.ZERO;

            if ("CASH".equalsIgnoreCase(paymentMethod)) cash = amount;
            else if ("MOMO".equalsIgnoreCase(paymentMethod)) momo = amount;
            else if ("VIETQR".equalsIgnoreCase(paymentMethod)) vietqr = amount;
            else if ("BANKING".equalsIgnoreCase(paymentMethod)) banking = amount;
            else if ("PAYOS".equalsIgnoreCase(paymentMethod)) payos = amount;
            else other = amount;

            PaymentBreakdown breakdown = new PaymentBreakdown(cash, momo, vietqr, banking, other, payos);
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
                new PaymentBreakdown(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
            
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
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
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
    
    private void updateDailyItemStat(UUID tenantId, UUID branchId, UUID itemId, String itemName, LocalDate date,
                                     int qtySold, BigDecimal revenue) {
        Optional<DailyItemStat> existing = dailyItemStatRepo.findByBranchIdItemIdAndDate(branchId, itemId, date);
        
        DailyItemStat stat;
        if (existing.isPresent()) {
            DailyItemStat old = existing.get();
            int newQty = old.qtySold() + qtySold;
            BigDecimal newRevenue = old.revenue().add(revenue);
            BigDecimal newCost = old.cost() != null ? old.cost() : BigDecimal.ZERO;
            BigDecimal newMargin = newRevenue.compareTo(BigDecimal.ZERO) > 0 ?
                newRevenue.subtract(newCost)
                    .divide(newRevenue, 2, java.math.RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")) :
                BigDecimal.ZERO;
            
            stat = new DailyItemStat(
                old.id(), tenantId, branchId, itemId, resolveItemName(old.itemName(), itemName),
                date, newQty, newRevenue, newCost, newMargin
            );
        } else {
            stat = new DailyItemStat(
                UUID.randomUUID(), tenantId, branchId, itemId, itemName,
                date, qtySold, revenue, BigDecimal.ZERO, BigDecimal.ZERO
            );
        }
        
        dailyItemStatRepo.save(stat);
    }

    private void updateDailyItemCosts(OrderCostCalculatedEvent event) {
        if (event.itemCosts() == null || event.itemCosts().isEmpty()) {
            return;
        }

        for (OrderCostCalculatedEvent.ItemCost itemCost : event.itemCosts()) {
            BigDecimal additionalCost = itemCost.cost() != null ? itemCost.cost() : BigDecimal.ZERO;
            Optional<DailyItemStat> existing = dailyItemStatRepo.findByBranchIdItemIdAndDate(
                event.branchId(), itemCost.itemId(), event.date()
            );

            DailyItemStat stat;
            if (existing.isPresent()) {
                DailyItemStat old = existing.get();
                BigDecimal oldCost = old.cost() != null ? old.cost() : BigDecimal.ZERO;
                BigDecimal revenue = old.revenue() != null ? old.revenue() : BigDecimal.ZERO;
                BigDecimal newCost = oldCost.add(additionalCost);
                BigDecimal newMargin = revenue.compareTo(BigDecimal.ZERO) > 0
                    ? revenue.subtract(newCost)
                        .divide(revenue, 2, java.math.RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                    : BigDecimal.ZERO;

                stat = new DailyItemStat(
                    old.id(), old.tenantId(), old.branchId(), old.itemId(), old.itemName(),
                    old.date(), old.qtySold(), old.revenue(), newCost, newMargin
                );
            } else {
                // Author: Hoàng | Date: 2026-05-09 | Note: Cost event có thể đến trước revenue stat do Inventory chạy async.
                stat = new DailyItemStat(
                    UUID.randomUUID(), event.tenantId(), event.branchId(), itemCost.itemId(), "Chưa xác định",
                    event.date(), 0, BigDecimal.ZERO, additionalCost, BigDecimal.ZERO
                );
            }

            dailyItemStatRepo.save(stat);
        }
    }

    private String resolveItemName(String currentName, String fallbackName) {
        if (currentName == null || currentName.isBlank() || "Chưa xác định".equals(currentName)) {
            return fallbackName;
        }
        return currentName;
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

}
