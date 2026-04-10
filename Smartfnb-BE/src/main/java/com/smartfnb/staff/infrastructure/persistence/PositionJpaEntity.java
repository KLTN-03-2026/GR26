package com.smartfnb.staff.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity cho bảng positions (chức vụ nhân viên theo tenant).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Entity
@Table(
    name = "positions",
    indexes = {
        @Index(name = "idx_positions_tenant", columnList = "tenant_id")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PositionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** UUID tenant */
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    /** Tên chức vụ — unique trong tenant */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /** Mô tả chức vụ */
    @Column(name = "description", length = 255)
    private String description;

    /** Trạng thái hoạt động */
    @Column(name = "is_active", nullable = false)
    private boolean active;

    /** Thời điểm tạo */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Factory method tạo chức vụ mới.
     *
     * @param tenantId    UUID tenant
     * @param name        Tên chức vụ
     * @param description Mô tả
     * @return PositionJpaEntity mới
     */
    public static PositionJpaEntity create(UUID tenantId, String name, String description) {
        PositionJpaEntity entity = new PositionJpaEntity();

        entity.tenantId = tenantId;
        entity.name = name;
        entity.description = description;
        entity.active = true;
        entity.createdAt = Instant.now();
        return entity;
    }
}
