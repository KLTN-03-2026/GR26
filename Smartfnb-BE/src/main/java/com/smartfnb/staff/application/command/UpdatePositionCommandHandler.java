package com.smartfnb.staff.application.command;

import com.smartfnb.staff.domain.exception.PositionNotFoundException;
import com.smartfnb.staff.infrastructure.persistence.PositionJpaEntity;
import com.smartfnb.staff.infrastructure.persistence.PositionJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handler xử lý lệnh cập nhật chức vụ (S-15).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UpdatePositionCommandHandler {

    private final PositionJpaRepository positionJpaRepository;

    /**
     * Cập nhật thông tin chức vụ.
     *
     * @param command thông tin cập nhật
     * @throws PositionNotFoundException nếu không tìm thấy chức vụ
     */
    @Transactional
    public void handle(UpdatePositionCommand command) {
        log.info("Cập nhật chức vụ: positionId={}", command.positionId());

        PositionJpaEntity position = positionJpaRepository
                .findByIdAndTenantId(command.positionId(), command.tenantId())
                .orElseThrow(() -> new PositionNotFoundException(command.positionId()));

        if (command.name() != null) position.setName(command.name());
        if (command.description() != null) position.setDescription(command.description());
        if (command.active() != null) position.setActive(command.active());

        positionJpaRepository.save(position);
        log.info("Cập nhật chức vụ thành công: positionId={}", command.positionId());
    }
}
