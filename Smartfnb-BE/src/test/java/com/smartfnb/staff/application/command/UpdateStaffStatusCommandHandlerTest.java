package com.smartfnb.staff.application.command;

import com.smartfnb.inventory.infrastructure.persistence.AuditLogJpaEntity;
import com.smartfnb.staff.domain.exception.StaffNotFoundException;
import com.smartfnb.staff.infrastructure.persistence.StaffAuditLogJpaRepository;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaEntity;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho UpdateStaffStatusCommandHandler — Bug Fix S-15.
 *
 * <p>Kiểm tra toàn bộ luồng nghiệp vụ:
 * <ol>
 *   <li>✅ Khóa nhân viên ACTIVE → INACTIVE thành công</li>
 *   <li>✅ Mở khóa nhân viên INACTIVE → ACTIVE thành công</li>
 *   <li>✅ Idempotency: gửi status giống hiện tại → bỏ qua, không save</li>
 *   <li>✅ Không tìm thấy nhân viên → StaffNotFoundException</li>
 *   <li>✅ Status không hợp lệ (ví dụ LOCKED, DELETED...) → IllegalArgumentException</li>
 *   <li>✅ Audit log được ghi đúng action type (STAFF_DEACTIVATED / STAFF_ACTIVATED)</li>
 *   <li>✅ Tenant isolation: chỉ tìm nhân viên trong đúng tenant</li>
 * </ol>
 *
 * @author vutq
 * @since 2026-04-10
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateStaffStatusCommandHandler — Bug Fix S-15: Khóa/Mở khóa nhân viên")
class UpdateStaffStatusCommandHandlerTest {

    @Mock
    private StaffJpaRepository staffJpaRepository;

    @Mock
    private StaffAuditLogJpaRepository auditLogJpaRepository;

    @InjectMocks
    private UpdateStaffStatusCommandHandler handler;

    // ─── Common test fixtures ────────────────────────────────────────────────
    private UUID tenantId;
    private UUID performedByUserId;
    private UUID staffId;

    @BeforeEach
    void setUp() {
        tenantId         = UUID.randomUUID();
        performedByUserId = UUID.randomUUID();
        staffId          = UUID.randomUUID();
    }

    // ─── Helper: tạo entity nhân viên với status cho trước ──────────────────
    private StaffJpaEntity makeStaff(String status) {
        StaffJpaEntity staff = StaffJpaEntity.create(
                tenantId, "Nguyễn Văn A", "0987654321",
                "nva@cafe.vn", null, "NV001", null
        );
        // activate() / deactivate() để set đúng status ban đầu
        if ("INACTIVE".equals(status)) {
            staff.deactivate();
        }
        return staff;
    }

    // ════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("✅ Happy Path — Thay đổi status thành công")
    class HappyPath {

        @Test
        @DisplayName("Khóa nhân viên: ACTIVE → INACTIVE — lưu DB + ghi audit STAFF_DEACTIVATED")
        void shouldDeactivateActiveStaff() {
            // Arrange
            StaffJpaEntity staff = makeStaff("ACTIVE");
            assertThat(staff.getStatus()).isEqualTo("ACTIVE"); // tiền điều kiện

            when(staffJpaRepository.findByIdAndTenantId(staffId, tenantId))
                    .thenReturn(Optional.of(staff));
            when(auditLogJpaRepository.save(any())).thenReturn(null);

            UpdateStaffStatusCommand command = new UpdateStaffStatusCommand(
                    tenantId, performedByUserId, staffId, "INACTIVE", "Vi phạm nội quy"
            );

            // Act
            handler.handle(command);

            // Assert — status đã thay đổi
            assertThat(staff.getStatus()).isEqualTo("INACTIVE");

            // Assert — đã lưu nhân viên
            verify(staffJpaRepository).save(staff);

            // Assert — audit log ghi đúng action type
            ArgumentCaptor<AuditLogJpaEntity> auditCaptor =
                    ArgumentCaptor.forClass(AuditLogJpaEntity.class);
            verify(auditLogJpaRepository).save(auditCaptor.capture());

            AuditLogJpaEntity savedLog = auditCaptor.getValue();
            assertThat(savedLog.getAction()).isEqualTo("STAFF_DEACTIVATED");
            assertThat(savedLog.getNewValue()).contains("ACTIVE");
            assertThat(savedLog.getNewValue()).contains("INACTIVE");
            assertThat(savedLog.getNewValue()).contains("Vi phạm nội quy");
        }

        @Test
        @DisplayName("Mở khóa nhân viên: INACTIVE → ACTIVE — lưu DB + ghi audit STAFF_ACTIVATED")
        void shouldActivateInactiveStaff() {
            // Arrange
            StaffJpaEntity staff = makeStaff("INACTIVE");
            assertThat(staff.getStatus()).isEqualTo("INACTIVE"); // tiền điều kiện

            when(staffJpaRepository.findByIdAndTenantId(staffId, tenantId))
                    .thenReturn(Optional.of(staff));
            when(auditLogJpaRepository.save(any())).thenReturn(null);

            UpdateStaffStatusCommand command = new UpdateStaffStatusCommand(
                    tenantId, performedByUserId, staffId, "ACTIVE", "Xử lý kỷ luật xong"
            );

            // Act
            handler.handle(command);

            // Assert — status đã thay đổi
            assertThat(staff.getStatus()).isEqualTo("ACTIVE");

            // Assert — đã lưu nhân viên
            verify(staffJpaRepository).save(staff);

            // Assert — audit log ghi đúng action type
            ArgumentCaptor<AuditLogJpaEntity> auditCaptor =
                    ArgumentCaptor.forClass(AuditLogJpaEntity.class);
            verify(auditLogJpaRepository).save(auditCaptor.capture());

            AuditLogJpaEntity savedLog = auditCaptor.getValue();
            assertThat(savedLog.getAction()).isEqualTo("STAFF_ACTIVATED");
            assertThat(savedLog.getNewValue()).contains("INACTIVE");
            assertThat(savedLog.getNewValue()).contains("ACTIVE");
            assertThat(savedLog.getNewValue()).contains("Xử lý kỷ luật xong");
        }

        @Test
        @DisplayName("Status lowercase 'inactive' → tự động uppercase, xử lý đúng")
        void shouldHandleLowercaseStatusInput() {
            // Arrange — FE có thể gửi lowercase dù bị validate, handler phòng thủ thêm
            StaffJpaEntity staff = makeStaff("ACTIVE");

            when(staffJpaRepository.findByIdAndTenantId(staffId, tenantId))
                    .thenReturn(Optional.of(staff));
            when(auditLogJpaRepository.save(any())).thenReturn(null);

            UpdateStaffStatusCommand command = new UpdateStaffStatusCommand(
                    tenantId, performedByUserId, staffId, "inactive", "Nghỉ thai sản"
            );

            // Act — không được throw exception
            assertThatCode(() -> handler.handle(command)).doesNotThrowAnyException();

            // Assert
            assertThat(staff.getStatus()).isEqualTo("INACTIVE");
        }

        @Test
        @DisplayName("Audit log chứa đúng tenantId và performedByUserId")
        void shouldWriteAuditLogWithCorrectTenantAndPerformer() {
            // Arrange
            StaffJpaEntity staff = makeStaff("ACTIVE");

            when(staffJpaRepository.findByIdAndTenantId(staffId, tenantId))
                    .thenReturn(Optional.of(staff));
            when(auditLogJpaRepository.save(any())).thenReturn(null);

            UpdateStaffStatusCommand command = new UpdateStaffStatusCommand(
                    tenantId, performedByUserId, staffId, "INACTIVE", "Lý do test"
            );

            // Act
            handler.handle(command);

            // Assert
            ArgumentCaptor<AuditLogJpaEntity> captor =
                    ArgumentCaptor.forClass(AuditLogJpaEntity.class);
            verify(auditLogJpaRepository).save(captor.capture());

            AuditLogJpaEntity log = captor.getValue();
            assertThat(log.getTenantId()).isEqualTo(tenantId);
            assertThat(log.getUserId()).isEqualTo(performedByUserId);
            assertThat(log.getTargetId()).isEqualTo(staffId);
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("⚡ Idempotency — Không làm gì nếu status đã giống")
    class IdempotencyBehavior {

        @Test
        @DisplayName("Gửi INACTIVE khi nhân viên đã INACTIVE → bỏ qua, không save, không audit")
        void shouldDoNothingWhenStatusAlreadyInactive() {
            // Arrange
            StaffJpaEntity staff = makeStaff("INACTIVE");

            when(staffJpaRepository.findByIdAndTenantId(staffId, tenantId))
                    .thenReturn(Optional.of(staff));

            UpdateStaffStatusCommand command = new UpdateStaffStatusCommand(
                    tenantId, performedByUserId, staffId, "INACTIVE", "Duplicate request"
            );

            // Act — không được throw exception
            assertThatCode(() -> handler.handle(command)).doesNotThrowAnyException();

            // Assert — KHÔNG save, KHÔNG ghi audit
            verify(staffJpaRepository, never()).save(any());
            verify(auditLogJpaRepository, never()).save(any());
        }

        @Test
        @DisplayName("Gửi ACTIVE khi nhân viên đã ACTIVE → bỏ qua, không save, không audit")
        void shouldDoNothingWhenStatusAlreadyActive() {
            // Arrange
            StaffJpaEntity staff = makeStaff("ACTIVE");

            when(staffJpaRepository.findByIdAndTenantId(staffId, tenantId))
                    .thenReturn(Optional.of(staff));

            UpdateStaffStatusCommand command = new UpdateStaffStatusCommand(
                    tenantId, performedByUserId, staffId, "ACTIVE", "No-op"
            );

            // Act
            assertThatCode(() -> handler.handle(command)).doesNotThrowAnyException();

            // Assert — KHÔNG save, KHÔNG ghi audit
            verify(staffJpaRepository, never()).save(any());
            verify(auditLogJpaRepository, never()).save(any());
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("❌ Exception Cases — Dữ liệu không hợp lệ hoặc không tìm thấy")
    class ExceptionCases {

        @Test
        @DisplayName("Nhân viên không tồn tại (sai ID) → StaffNotFoundException")
        void shouldThrowStaffNotFoundException_WhenStaffNotFound() {
            // Arrange
            when(staffJpaRepository.findByIdAndTenantId(staffId, tenantId))
                    .thenReturn(Optional.empty());

            UpdateStaffStatusCommand command = new UpdateStaffStatusCommand(
                    tenantId, performedByUserId, staffId, "INACTIVE", "Test"
            );

            // Act & Assert
            assertThatExceptionOfType(StaffNotFoundException.class)
                    .isThrownBy(() -> handler.handle(command));

            // Assert — KHÔNG save khi lỗi
            verify(staffJpaRepository, never()).save(any());
            verify(auditLogJpaRepository, never()).save(any());
        }

        @Test
        @DisplayName("Nhân viên của tenant khác → không tìm thấy (IDOR protection)")
        void shouldThrowNotFoundException_WhenDifferentTenant() {
            // Arrange — query findByIdAndTenantId trả empty (khác tenant)
            UUID differentTenantId = UUID.randomUUID();
            when(staffJpaRepository.findByIdAndTenantId(staffId, differentTenantId))
                    .thenReturn(Optional.empty());

            UpdateStaffStatusCommand command = new UpdateStaffStatusCommand(
                    differentTenantId, performedByUserId, staffId, "INACTIVE", "IDOR test"
            );

            // Act & Assert
            assertThatExceptionOfType(StaffNotFoundException.class)
                    .isThrownBy(() -> handler.handle(command));
        }

        @Test
        @DisplayName("Status không hợp lệ 'LOCKED' → IllegalArgumentException")
        void shouldThrowIllegalArgument_WhenStatusIsLocked() {
            // Arrange — không cần mock repository (validate trước khi query)
            UpdateStaffStatusCommand command = new UpdateStaffStatusCommand(
                    tenantId, performedByUserId, staffId, "LOCKED", "Invalid status"
            );

            // Act & Assert
            assertThatExceptionOfType(IllegalArgumentException.class)
                    .isThrownBy(() -> handler.handle(command))
                    .withMessageContaining("LOCKED")
                    .withMessageContaining("ACTIVE")
                    .withMessageContaining("INACTIVE");

            // Assert — KHÔNG query DB (validate fail sớm)
            verify(staffJpaRepository, never()).findByIdAndTenantId(any(), any());
            verify(auditLogJpaRepository, never()).save(any());
        }

        @Test
        @DisplayName("Status không hợp lệ 'DELETED' → IllegalArgumentException")
        void shouldThrowIllegalArgument_WhenStatusIsDeleted() {
            UpdateStaffStatusCommand command = new UpdateStaffStatusCommand(
                    tenantId, performedByUserId, staffId, "DELETED", "Invalid"
            );

            assertThatExceptionOfType(IllegalArgumentException.class)
                    .isThrownBy(() -> handler.handle(command));

            verify(staffJpaRepository, never()).findByIdAndTenantId(any(), any());
        }

        @Test
        @DisplayName("Status rỗng '' → IllegalArgumentException")
        void shouldThrowIllegalArgument_WhenStatusIsEmpty() {
            UpdateStaffStatusCommand command = new UpdateStaffStatusCommand(
                    tenantId, performedByUserId, staffId, "", "Empty status"
            );

            // "" toUpperCase = "" → không match ACTIVE hay INACTIVE
            assertThatExceptionOfType(IllegalArgumentException.class)
                    .isThrownBy(() -> handler.handle(command));
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("🔒 Tenant Isolation — Chỉ query đúng tenant")
    class TenantIsolation {

        @Test
        @DisplayName("findByIdAndTenantId luôn được gọi với đúng tenantId")
        void shouldAlwaysQueryWithCorrectTenantId() {
            // Arrange
            StaffJpaEntity staff = makeStaff("ACTIVE");
            when(staffJpaRepository.findByIdAndTenantId(staffId, tenantId))
                    .thenReturn(Optional.of(staff));
            when(auditLogJpaRepository.save(any())).thenReturn(null);

            UpdateStaffStatusCommand command = new UpdateStaffStatusCommand(
                    tenantId, performedByUserId, staffId, "INACTIVE", "Lý do"
            );

            // Act
            handler.handle(command);

            // Assert — phải được gọi với ĐÚNG tenantId, không phải UUID khác
            verify(staffJpaRepository).findByIdAndTenantId(staffId, tenantId);
            // Không được gọi với tenantId khác
            verify(staffJpaRepository, never())
                    .findByIdAndTenantId(eq(staffId), org.mockito.AdditionalMatchers.not(eq(tenantId)));
        }
    }
}
