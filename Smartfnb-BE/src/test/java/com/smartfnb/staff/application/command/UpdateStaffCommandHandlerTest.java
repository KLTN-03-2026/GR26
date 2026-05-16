package com.smartfnb.staff.application.command;

import com.smartfnb.staff.domain.exception.PositionInactiveException;
import com.smartfnb.staff.infrastructure.persistence.PositionJpaEntity;
import com.smartfnb.staff.infrastructure.persistence.PositionJpaRepository;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaEntity;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateStaffCommandHandler")
class UpdateStaffCommandHandlerTest {

    @Mock
    private StaffJpaRepository staffJpaRepository;

    @Mock
    private PositionJpaRepository positionJpaRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UpdateStaffCommandHandler handler;

    private UUID tenantId;
    private UUID staffId;
    private UUID currentPositionId;
    private UUID newPositionId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        staffId = UUID.randomUUID();
        currentPositionId = UUID.randomUUID();
        newPositionId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Không cho đổi nhân viên sang chức vụ đã bị vô hiệu hóa")
    void shouldBlockAssigningInactivePosition() {
        StaffJpaEntity staff = StaffJpaEntity.create(
                tenantId, "Nguyen Van A", "0987654321",
                "a@smartfnb.vn", currentPositionId, "NV001", null);
        PositionJpaEntity inactivePosition = PositionJpaEntity.create(
                tenantId, "Inactive", "Inactive position", BigDecimal.ZERO);
        inactivePosition.setActive(false);

        when(staffJpaRepository.findByIdAndTenantId(staffId, tenantId))
                .thenReturn(Optional.of(staff));
        when(positionJpaRepository.findByIdAndTenantId(newPositionId, tenantId))
                .thenReturn(Optional.of(inactivePosition));

        UpdateStaffCommand command = new UpdateStaffCommand(
                tenantId, UUID.randomUUID(), staffId,
                null, null, null, newPositionId,
                null, null, null, null, null, null, null
        );

        assertThatExceptionOfType(PositionInactiveException.class)
                .isThrownBy(() -> handler.handle(command));

        assertThat(staff.getPositionId()).isEqualTo(currentPositionId);
        verify(staffJpaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Không validate lại position nếu request gửi đúng chức vụ hiện tại")
    void shouldSkipPositionValidationWhenPositionDoesNotChange() {
        StaffJpaEntity staff = StaffJpaEntity.create(
                tenantId, "Nguyen Van A", "0987654321",
                "a@smartfnb.vn", currentPositionId, "NV001", null);

        when(staffJpaRepository.findByIdAndTenantId(staffId, tenantId))
                .thenReturn(Optional.of(staff));

        UpdateStaffCommand command = new UpdateStaffCommand(
                tenantId, UUID.randomUUID(), staffId,
                "Nguyen Van B", null, null, currentPositionId,
                null, null, null, null, null, null, null
        );

        handler.handle(command);

        assertThat(staff.getFullName()).isEqualTo("Nguyen Van B");
        verify(positionJpaRepository, never()).findByIdAndTenantId(any(), any());
        verify(staffJpaRepository).save(staff);
    }
}
