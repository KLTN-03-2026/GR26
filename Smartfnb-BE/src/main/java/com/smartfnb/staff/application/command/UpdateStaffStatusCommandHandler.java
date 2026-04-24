package com.smartfnb.staff.application.command;

import com.smartfnb.inventory.infrastructure.persistence.AuditLogJpaEntity;
import com.smartfnb.staff.domain.exception.StaffNotFoundException;
import com.smartfnb.staff.infrastructure.persistence.StaffAuditLogJpaRepository;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaEntity;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handler xử lý lệnh cập nhật trạng thái nhân viên (Bug Fix S-15).
 *
 * <p>Xử lý 2 hành động nghiệp vụ:
 * <ul>
 *   <li>Khóa nhân viên: ACTIVE → INACTIVE (không soft-delete, vẫn truy vấn được)</li>
 *   <li>Mở khóa nhân viên: INACTIVE → ACTIVE</li>
 * </ul>
 *
 * <p>Khác với {@link DeactivateStaffCommandHandler} (soft delete — ẩn khỏi mọi query),
 * handler này chỉ thay đổi {@code status} mà KHÔNG set {@code deleted_at}.
 * Nhân viên bị khóa vẫn hiện trong danh sách nếu FE lọc theo {@code status=INACTIVE}.
 *
 * @author vutq
 * @since 2026-04-10
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UpdateStaffStatusCommandHandler {

    private static final String STATUS_ACTIVE   = "ACTIVE";
    private static final String STATUS_INACTIVE = "INACTIVE";

    private final StaffJpaRepository         staffJpaRepository;
    private final StaffAuditLogJpaRepository auditLogJpaRepository;
    private final com.smartfnb.plan.application.SubscriptionService subscriptionService;

    /**
     * Cập nhật trạng thái nhân viên.
     *
     * <p>Logic:
     * <ol>
     *   <li>Validate giá trị status (chỉ ACTIVE | INACTIVE)</li>
     *   <li>Tìm nhân viên theo ID + tenantId (chống IDOR)</li>
     *   <li>Guard idempotent: bỏ qua nếu status đã giống</li>
     *   <li>Thay đổi status + lưu</li>
     *   <li>Ghi audit_log bắt buộc</li>
     * </ol>
     *
     * @param command lệnh với trạng thái mới (ACTIVE | INACTIVE) và lý do
     * @throws StaffNotFoundException  nếu nhân viên không tồn tại hoặc đã bị soft-delete
     * @throws IllegalArgumentException nếu trạng thái không hợp lệ
     */
    @Transactional
    public void handle(UpdateStaffStatusCommand command) {
        log.info("Cập nhật trạng thái nhân viên: staffId={}, newStatus={}", command.staffId(), command.newStatus());

        // 1. Validate giá trị status đầu vào
        String newStatus = command.newStatus().toUpperCase();
        if (!STATUS_ACTIVE.equals(newStatus) && !STATUS_INACTIVE.equals(newStatus)) {
            throw new IllegalArgumentException(
                    "Trạng thái không hợp lệ: " + command.newStatus() +
                    ". Chỉ chấp nhận ACTIVE hoặc INACTIVE.");
        }

        // 2. Tìm nhân viên (+ kiểm tra tenant isolation)
        StaffJpaEntity staff = staffJpaRepository
                .findByIdAndTenantId(command.staffId(), command.tenantId())
                .orElseThrow(() -> new StaffNotFoundException(command.staffId()));

        // 3. Guard idempotent: không cho phép thay đổi sang trạng thái đang có
        if (newStatus.equals(staff.getStatus())) {
            log.warn("Nhân viên staffId={} đã ở trạng thái {}, bỏ qua", command.staffId(), newStatus);
            return; // yên lặng thành công, không throw lỗi
        }

        // 4. Thay đổi trạng thái
        String oldStatus = staff.getStatus();
        if (STATUS_ACTIVE.equals(newStatus)) {
            // Guard: Kiểm tra giới hạn staff của gói trước khi kích hoạt lại
            com.smartfnb.plan.application.dto.SubscriptionResponse sub = 
                    subscriptionService.getCurrentSubscription(command.tenantId());
            Integer maxStaff = sub.plan().maxStaff();
            if (maxStaff != null) {
                long currentActiveCount = staffJpaRepository.countByTenantIdAndStatus(command.tenantId(), STATUS_ACTIVE);
                if (currentActiveCount >= maxStaff) {
                    throw new com.smartfnb.shared.exception.SmartFnbException("PLAN_LIMIT_EXCEEDED",
                            "Gói hiện tại giới hạn tối đa " + maxStaff + " nhân viên đang hoạt động. Vui lòng nâng cấp gói hoặc vô hiệu hóa nhân viên khác trước khi kích hoạt.", 403);
                }
            }
            
            staff.activate();
        } else {
            staff.deactivate();
        }
        staffJpaRepository.save(staff);

        // 5. Ghi audit_log (bắt buộc theo coding guidelines § 6.3)
        String actionType = STATUS_ACTIVE.equals(newStatus) ? "STAFF_ACTIVATED" : "STAFF_DEACTIVATED";
        String detail = String.format(
                "{\"staffId\":\"%s\",\"fullName\":\"%s\",\"oldStatus\":\"%s\",\"newStatus\":\"%s\",\"reason\":\"%s\"}",
                staff.getId(), staff.getFullName(), oldStatus, newStatus, command.reason());

        AuditLogJpaEntity auditLog = AuditLogJpaEntity.forStaffAction(
                command.tenantId(), command.performedByUserId(),
                command.staffId(), actionType, detail);
        auditLogJpaRepository.save(auditLog);

        log.info("Cập nhật trạng thái nhân viên thành công: staffId={}, {} → {}",
                command.staffId(), oldStatus, newStatus);
    }
}
