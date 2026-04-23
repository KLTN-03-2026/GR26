package com.smartfnb.staff.application.command;

import java.util.UUID;

/**
 * Lệnh vô hiệu hoá / xoá mềm nhân viên.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record DeactivateStaffCommand(
        /** UUID tenant — lấy từ TenantContext */
        UUID tenantId,
        /** UUID người thực hiện — lấy từ TenantContext */
        UUID performedByUserId,
        /** UUID nhân viên cần vô hiệu hoá */
        UUID staffId,
        /** Lý do vô hiệu hoá (bắt buộc để audit trail) */
        String reason
) {}
