package com.smartfnb.report.application.query.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.YearMonth;
import java.util.UUID;

/**
 * Query để lấy báo cáo lương tháng
 * 
 * 🔒 CRITICAL: Staff can ONLY query own payroll (enforced at handler level)
 * 
 * @param branchId: Lọc theo chi nhánh
 * @param month: Tháng (YYYY-MM format)
 * @param staffId: Staff ID (required if current user is STAFF)
 * @param currentUserId: Current logged-in user (for validation)
 * @param currentUserRole: Current user role (for privacy checks)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetPayrollQuery {
    private UUID branchId;
    private UUID tenantId;
    private YearMonth month;
    private UUID staffId;              // Optional for OWNER/ADMIN, Required for STAFF
    private UUID currentUserId;        // For privacy validation
    private String currentUserRole;    // OWNER | ADMIN | BRANCH_MANAGER | STAFF
}
