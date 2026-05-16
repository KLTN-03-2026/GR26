package com.smartfnb.staff.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity cho bảng positions (chức vụ nhân viên theo tenant).
 *
 * @author vutq
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

    /** Lương cơ bản */
    @Column(name = "base_salary", precision = 12, scale = 2)
    private BigDecimal baseSalary;

    /** Thời điểm tạo */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Factory method tạo chức vụ mới.
     *
     * @param tenantId    UUID tenant
     * @param name        Tên chức vụ
     * @param description Mô tả
     * @param baseSalary  Lương cơ bản
     * @return PositionJpaEntity mới
     */
    public static PositionJpaEntity create(UUID tenantId, String name, String description, BigDecimal baseSalary) {
        PositionJpaEntity entity = new PositionJpaEntity();

        entity.tenantId = tenantId;
        entity.name = name;
        entity.description = description;
        entity.baseSalary = baseSalary != null ? baseSalary : BigDecimal.ZERO;
        entity.active = true;
        entity.createdAt = Instant.now();
        return entity;
    }
}
