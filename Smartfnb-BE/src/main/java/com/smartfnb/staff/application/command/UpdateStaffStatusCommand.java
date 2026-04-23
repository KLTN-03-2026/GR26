package com.smartfnb.staff.application.command;

import java.util.UUID;

/**
 * Lệnh cập nhật trạng thái nhân viên (khóa / mở khóa).
 * Tách riêng khỏi UpdateStaffCommand để rõ intent nghiệp vụ.
 *
 * <p>Dùng cho PATCH /api/v1/staff/{id}/status — Bug Fix S-15.
 *
 * @author vutq
 * @since 2026-04-10
 */
public record UpdateStaffStatusCommand(
        /** UUID tenant — lấy từ TenantContext */
        UUID tenantId,
        /** UUID người thực hiện — lấy từ TenantContext */
        UUID performedByUserId,
        /** UUID nhân viên cần thay đổi trạng thái */
        UUID staffId,
        /** Trạng thái mới: ACTIVE | INACTIVE */
        String newStatus,
        /** Lý do thay đổi (bắt buộc cho audit trail) */
        String reason
) {}
