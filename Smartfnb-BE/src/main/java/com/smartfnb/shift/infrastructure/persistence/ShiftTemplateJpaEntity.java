package com.smartfnb.shift.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

/**
 * JPA Entity cho bảng shift_templates (ca mẫu của chi nhánh).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Entity
@Table(
    name = "shift_templates",
    indexes = {
        @Index(name = "idx_shift_templates_branch", columnList = "branch_id"),
        @Index(name = "idx_shift_templates_tenant", columnList = "tenant_id")
    }
)
@Getter
@Setter(AccessLevel.PACKAGE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ShiftTemplateJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "branch_id", nullable = false, updatable = false)
    private UUID branchId;

    /** Tên ca mẫu — unique trong branch */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /** Giờ bắt đầu ca */
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    /** Giờ kết thúc ca */
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    /** Số nhân viên tối thiểu cần cho ca */
    @Column(name = "min_staff", nullable = false)
    private int minStaff;

    /** Số nhân viên tối đa cho phép trong ca */
    @Column(name = "max_staff", nullable = false)
    private int maxStaff;

    /** Màu hex để hiển thị trên UI calendar */
    @Column(name = "color", length = 7)
    private String color;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Factory method tạo shift template mới.
     *
     * @param tenantId  UUID tenant
     * @param branchId  UUID chi nhánh
     * @param name      Tên ca
     * @param startTime Giờ bắt đầu
     * @param endTime   Giờ kết thúc
     * @param minStaff  Số NV tối thiểu
     * @param maxStaff  Số NV tối đa
     * @param color     Màu hex (#FF5733)
     * @return ShiftTemplateJpaEntity mới
     */
    public static ShiftTemplateJpaEntity create(UUID tenantId, UUID branchId, String name,
                                                 LocalTime startTime, LocalTime endTime,
                                                 int minStaff, int maxStaff, String color) {
        ShiftTemplateJpaEntity entity = new ShiftTemplateJpaEntity();

        entity.tenantId = tenantId;
        entity.branchId = branchId;
        entity.name = name;
        entity.startTime = startTime;
        entity.endTime = endTime;
        entity.minStaff = minStaff;
        entity.maxStaff = maxStaff;
        entity.color = color;
        entity.active = true;
        entity.createdAt = Instant.now();
        return entity;
    }

    /**
     * Tính thời lượng ca theo phút.
     *
     * @return số phút ca làm việc
     */
    public int getDurationMinutes() {
        return (int) java.time.Duration.between(startTime, endTime).toMinutes();
    }

    /**
     * Cập nhật thông tin ca mẫu (dành cho UpdateShiftTemplateCommandHandler).
     *
     * @param name      Tên ca mới
     * @param startTime Giờ bắt đầu mới
     * @param endTime   Giờ kết thúc mới
     * @param minStaff  Số NV tối thiểu mới
     * @param maxStaff  Số NV tối đa mới
     * @param color     Màu hex mới
     * @param active    Trạng thái active
     */
    public void update(String name, LocalTime startTime, LocalTime endTime,
                       int minStaff, int maxStaff, String color, boolean active) {
        this.name = name;
        this.startTime = startTime;
        this.endTime = endTime;
        this.minStaff = minStaff;
        this.maxStaff = maxStaff;
        this.color = color;
        this.active = active;
    }

    /**
     * Deactivate ca mẫu (soft delete).
     * Giữ lại dữ liệu lịch sử nhưng ngăn chọn trong tương lai.
     */
    public void deactivate() {
        this.active = false;
    }
}
