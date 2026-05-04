package com.smartfnb.report.infrastructure.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * Domain Event Publisher cho S-19 Reports
 * 
 * Utility class để publish domain events mà trigger cache invalidation.
 * 
 * Events:
 * - reportCacheInvalidated: Thông báo cache đã được invalidate
 * - orderCompleted: Order hoàn tất, trigger inventory cache clear
 * - shiftCompleted: Shift hoàn tất, trigger HR cache clear
 * - inventoryUpdated: Kho bị update, trigger inventory cache clear
 * - payrollGenerated: Lương được tạo, trigger payroll cache clear
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReportEventPublisher {
    
    private final ApplicationEventPublisher eventPublisher;
    
    /**
     * Publish OrderCompleted event
     * 
     * Triggers: inventory:stock, inventory:cogs, inventory:waste clear
     */
    public void publishOrderCompleted(String orderId) {
        log.info("Publishing OrderCompleted event: {}", orderId);
        eventPublisher.publishEvent("OrderCompleted::" + orderId);
    }
    
    /**
     * Publish ShiftCompleted event
     * 
     * Triggers: hr:attendance, hr:violations, hr:checkin-history clear
     */
    public void publishShiftCompleted(String shiftId) {
        log.info("Publishing ShiftCompleted event: {}", shiftId);
        eventPublisher.publishEvent("ShiftCompleted::" + shiftId);
    }
    
    /**
     * Publish InventoryUpdated event
     * 
     * Triggers: All inventory caches clear
     */
    public void publishInventoryUpdated(String itemId, String updateType) {
        log.info("Publishing InventoryUpdated event: {} ({})", itemId, updateType);
        eventPublisher.publishEvent("InventoryUpdated::" + itemId + "::" + updateType);
    }
    
    /**
     * Publish PayrollGenerated event (🔒 Sensitive)
     * 
     * Triggers: hr:payroll, hr:cost caches clear
     */
    public void publishPayrollGenerated(String month, String branchId) {
        log.info("🔒 Publishing PayrollGenerated event: {}/{}", month, branchId);
        eventPublisher.publishEvent("PayrollGenerated::" + month + "::" + branchId);
    }
    
    /**
     * Publish ShiftScheduleCreated event
     * 
     * Triggers: hr:attendance, hr:checkin-history clear
     */
    public void publishShiftScheduleCreated(String scheduleId) {
        log.info("Publishing ShiftScheduleCreated event: {}", scheduleId);
        eventPublisher.publishEvent("ShiftScheduleCreated::" + scheduleId);
    }
}
