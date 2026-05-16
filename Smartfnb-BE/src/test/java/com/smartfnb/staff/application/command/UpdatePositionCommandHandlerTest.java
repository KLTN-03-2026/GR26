package com.smartfnb.staff.application.command;

import com.smartfnb.staff.domain.exception.PositionInUseException;
import com.smartfnb.staff.domain.exception.PositionNotFoundException;
import com.smartfnb.staff.infrastructure.persistence.PositionJpaEntity;
import com.smartfnb.staff.infrastructure.persistence.PositionJpaRepository;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
@DisplayName("UpdatePositionCommandHandler")
class UpdatePositionCommandHandlerTest {

    @Mock
    private PositionJpaRepository positionJpaRepository;

    @Mock
    private StaffJpaRepository staffJpaRepository;

    @InjectMocks
    private UpdatePositionCommandHandler handler;

    private UUID tenantId;
    private UUID positionId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        positionId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Không cho vô hiệu hóa chức vụ đang được gán cho nhân viên")
    void shouldBlockDeactivatePositionAssignedToStaff() {
        PositionJpaEntity position = PositionJpaEntity.create(
                tenantId, "Cashier", "Thu ngân", BigDecimal.ZERO);

        when(positionJpaRepository.findByIdAndTenantId(positionId, tenantId))
                .thenReturn(Optional.of(position));
        when(staffJpaRepository.existsByTenantIdAndPositionId(tenantId, positionId))
                .thenReturn(true);

        UpdatePositionCommand command = new UpdatePositionCommand(
                tenantId, positionId, null, null, null, false);

        assertThatExceptionOfType(PositionInUseException.class)
                .isThrownBy(() -> handler.handle(command));

        assertThat(position.isActive()).isTrue();
        verify(positionJpaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cho vô hiệu hóa chức vụ khi không còn nhân viên nào đang gán")
    void shouldDeactivatePositionWhenNotAssignedToStaff() {
        PositionJpaEntity position = PositionJpaEntity.create(
                tenantId, "Barista", "Pha chế", BigDecimal.ZERO);

        when(positionJpaRepository.findByIdAndTenantId(positionId, tenantId))
                .thenReturn(Optional.of(position));
        when(staffJpaRepository.existsByTenantIdAndPositionId(tenantId, positionId))
                .thenReturn(false);

        UpdatePositionCommand command = new UpdatePositionCommand(
                tenantId, positionId, null, null, null, false);

        handler.handle(command);

        assertThat(position.isActive()).isFalse();
        verify(positionJpaRepository).save(position);
    }

    @Test
    @DisplayName("Không kiểm tra nhân viên khi chỉ cập nhật thông tin chức vụ")
    void shouldNotCheckAssignedStaffWhenUpdatingPositionInfoOnly() {
        PositionJpaEntity position = PositionJpaEntity.create(
                tenantId, "Waiter", "Phục vụ", BigDecimal.ZERO);

        when(positionJpaRepository.findByIdAndTenantId(positionId, tenantId))
                .thenReturn(Optional.of(position));

        UpdatePositionCommand command = new UpdatePositionCommand(
                tenantId, positionId, "Senior Waiter", "Phục vụ chính", BigDecimal.TEN, null);

        handler.handle(command);

        assertThat(position.getName()).isEqualTo("Senior Waiter");
        assertThat(position.getDescription()).isEqualTo("Phục vụ chính");
        assertThat(position.getBaseSalary()).isEqualByComparingTo(BigDecimal.TEN);
        verify(staffJpaRepository, never()).existsByTenantIdAndPositionId(any(), any());
        verify(positionJpaRepository).save(position);
    }

    @Test
    @DisplayName("Không tìm thấy chức vụ thì trả lỗi not found")
    void shouldThrowNotFoundWhenPositionDoesNotExist() {
        when(positionJpaRepository.findByIdAndTenantId(positionId, tenantId))
                .thenReturn(Optional.empty());

        UpdatePositionCommand command = new UpdatePositionCommand(
                tenantId, positionId, null, null, null, false);

        assertThatExceptionOfType(PositionNotFoundException.class)
                .isThrownBy(() -> handler.handle(command));

        verify(staffJpaRepository, never()).existsByTenantIdAndPositionId(any(), any());
        verify(positionJpaRepository, never()).save(any());
    }
}
