package com.smartfnb.report.application.query.handler.hr;

import com.smartfnb.report.application.dto.hr.PayrollReportDto;
import com.smartfnb.report.application.query.hr.GetPayrollQuery;
import com.smartfnb.report.domain.repository.HrReportRepository;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Handler để xử lý GetPayrollQuery
 * 
 * 🔒 CRITICAL SECURITY:
 * - Staff CAN ONLY view own payroll (enforced here + controller)
 * - OWNER/ADMIN can view all staff payroll
 * - ALL access must be audit logged (sensitive data!)
 * - Cached with 30-min TTL (approved payroll doesn't change)
 */
@Slf4j
@Component
@AllArgsConstructor
public class GetPayrollQueryHandler {
    
    private final HrReportRepository repository;
    
    /**
     * Lấy báo cáo lương tháng
     * 
     * @param query: GetPayrollQuery with privacy context
     * @return List<PayrollReportDto> (filtered based on user role)
     * @throws SmartFnbException if privacy violation detected
     */
    // @Cacheable(
    //         value = "payroll_report",
    //         key = "#query.staffId.toString() + ':' + #query.month.toString()",
    //         cacheManager = "sensitiveCacheManager"  // 30 min TTL + audit
    // )
    public List<PayrollReportDto> handle(GetPayrollQuery query) {
        // 🔒 CRITICAL: Privacy validation
        validatePayrollAccess(query);
        
        log.info("Fetching payroll for staff: {}, month: {}", query.getStaffId(), query.getMonth());
        
        // Call repository
        List<PayrollReportDto> payrolls = repository.findPayroll(
                query.getBranchId(),
                query.getTenantId(),
                query.getMonth(),
                query.getStaffId()  // null if ADMIN viewing all
        );
        
        log.info("Found {} payroll records", payrolls.size());
        return payrolls;
    }
    
    /**
     * 🔒 CRITICAL VALIDATION: Ensure privacy rules are enforced
     * 
     * Rules:
     * - STAFF role can ONLY access own payroll
     * - ADMIN/OWNER can access any staff
     * - All other roles: FORBIDDEN
     * 
     * @param query: Query with user context
     * @throws SmartFnbException if access denied
     */
    private void validatePayrollAccess(GetPayrollQuery query) {
        // Check if current user is STAFF role
        if ("STAFF".equalsIgnoreCase(query.getCurrentUserRole())) {
            // STAFF can only access own payroll
            if (!query.getStaffId().equals(query.getCurrentUserId())) {
                String message = "Staff cannot view other staff payroll";
                log.warn("SECURITY: {} User {} tried to access staff {}'s payroll",
                        message, query.getCurrentUserId(), query.getStaffId());
                
                throw new SmartFnbException("PAYROLL_ACCESS_FORBIDDEN", message, 403);
            }
        }
        // ADMIN/OWNER: allowed to view anyone's payroll
        else if ("ADMIN".equalsIgnoreCase(query.getCurrentUserRole()) ||
                 "OWNER".equalsIgnoreCase(query.getCurrentUserRole())) {
            // Allowed
            log.info("ADMIN/OWNER accessing payroll for staff {}", query.getStaffId());
        }
        // All other roles: FORBIDDEN
        else {
            throw new SmartFnbException(
                    "INSUFFICIENT_PERMISSION",
                    "Insufficient permission to view payroll reports",
                    403);
        }
    }
}
