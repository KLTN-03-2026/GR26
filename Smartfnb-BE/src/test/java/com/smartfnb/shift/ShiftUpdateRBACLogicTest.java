package com.smartfnb.shift;

import com.smartfnb.shared.exception.SmartFnbException;
import com.smartfnb.shift.application.command.UpdateShiftScheduleCommand;
import com.smartfnb.shift.application.command.UpdateShiftScheduleCommandHandler;
import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleJpaEntity;
import com.smartfnb.shift.infrastructure.persistence.ShiftScheduleJpaRepository;
import com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class ShiftUpdateRBACLogicTest {

    @Mock private ShiftScheduleJpaRepository shiftScheduleJpaRepository;
    @Mock private ShiftTemplateJpaRepository shiftTemplateJpaRepository;

    @InjectMocks
    private UpdateShiftScheduleCommandHandler handler;

    private UUID tenantId = UUID.randomUUID();
    private UUID branchId = UUID.randomUUID();
    private UUID staffId = UUID.randomUUID();
    private UUID managerId = UUID.randomUUID();
    private UUID scheduleId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Test STAFF không được sửa ca của người khác")
    void testStaffCannotUpdateOthersShift() {
        // Arrange: Ca này của staffId
        ShiftScheduleJpaEntity schedule = mock(ShiftScheduleJpaEntity.class);
        when(schedule.getUserId()).thenReturn(staffId);
        when(schedule.getBranchId()).thenReturn(branchId);

        when(shiftScheduleJpaRepository.findByIdAndTenantId(scheduleId, tenantId))
                .thenReturn(Optional.of(schedule));

        // Command gửi bởi managerId nhưng isStaffRole = true (giả lập hacker hoặc lỗi gán role)
        UpdateShiftScheduleCommand command = new UpdateShiftScheduleCommand(
                tenantId, branchId, managerId, true, scheduleId,
                staffId, UUID.randomUUID(), LocalDate.now()
        );

        // Act & Assert
        SmartFnbException ex = assertThrows(SmartFnbException.class, () -> {
            handler.handle(command);
        });
        assertEquals("FORBIDDEN", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("chỉ được sửa ca của chính mình"));
    }

    @Test
    @DisplayName("Test MANAGER được phép sửa ca của bất kỳ ai")
    void testManagerCanUpdateAnyShift() {
        // Arrange
        ShiftScheduleJpaEntity schedule = mock(ShiftScheduleJpaEntity.class);
        when(schedule.getUserId()).thenReturn(staffId);
        when(schedule.getBranchId()).thenReturn(branchId);
        when(schedule.isScheduled()).thenReturn(true);

        when(shiftScheduleJpaRepository.findByIdAndTenantId(scheduleId, tenantId))
                .thenReturn(Optional.of(schedule));
        // Mock template check
        when(shiftTemplateJpaRepository.findByIdAndTenantId(any(), any()))
                .thenReturn(Optional.of(mock(com.smartfnb.shift.infrastructure.persistence.ShiftTemplateJpaEntity.class)));
        // Mock conflict check
        when(shiftScheduleJpaRepository.existsByUserIdAndShiftTemplateIdAndDateAndIdNot(any(), any(), any(), any()))
                .thenReturn(false);

        // Command gửi bởi managerId, isStaffRole = false
        UpdateShiftScheduleCommand command = new UpdateShiftScheduleCommand(
                tenantId, branchId, managerId, false, scheduleId,
                staffId, UUID.randomUUID(), LocalDate.now()
        );

        // Act
        handler.handle(command);

        // Assert
        verify(schedule).update(any(), any(), any());
        verify(shiftScheduleJpaRepository).save(schedule);
    }
}
