package com.smartfnb.shift.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * JPA Entity cho bảng shift_schedules (ca làm việc thực tế).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Entity
@Table(
    name = "shift_schedules",
    indexes = {
        @Index(name = "idx_shift_schedule_branch_date", columnList = "branch_id, date"),
        @Index(name = "idx_shift_schedule_user_date",   columnList = "user_id, date"),
        @Index(name = "idx_shift_schedule_tenant",      columnList = "tenant_id, date")
    }
)
@Getter
@Setter(AccessLevel.PACKAGE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ShiftScheduleJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "branch_id", nullable = false, updatable = false)
    private UUID branchId;

    /** Nhân viên được gán ca */
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    /** Ca mẫu được áp dụng */
    @Column(name = "shift_template_id", nullable = false, updatable = false)
    private UUID shiftTemplateId;

    /** Ngày làm việc */
    @Column(name = "date", nullable = false, updatable = false)
    private LocalDate date;

    /**
     * Trạng thái ca: SCHEDULED | CHECKED_IN | COMPLETED | ABSENT | CANCELLED.
     */
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    /** Thời điểm check-in thực tế */
    @Column(name = "checked_in_at")
    private Instant checkedInAt;

    /** Thời điểm check-out thực tế */
    @Column(name = "checked_out_at")
    private Instant checkedOutAt;

    /** Giờ check-in thực tế (tính overtime) */
    @Column(name = "actual_start_time")
    private LocalTime actualStartTime;

    /** Giờ check-out thực tế (tính overtime) */
    @Column(name = "actual_end_time")
    private LocalTime actualEndTime;

    /** Thời gian tăng ca (phút) — dương = tăng ca, âm = về sớm */
    @Column(name = "overtime_minutes", nullable = false)
    private int overtimeMinutes;

    /** Ghi chú */
    @Column(name = "note", length = 500)
    private String note;

    /** UUID người đăng ký ca (có thể là manager hoặc chính nhân viên) */
    @Column(name = "registered_by")
    private UUID registeredBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Factory method đăng ký ca làm việc mới.
     *
     * @param tenantId        UUID tenant
     * @param branchId        UUID chi nhánh
     * @param userId          UUID nhân viên
     * @param shiftTemplateId UUID ca mẫu
     * @param date            Ngày làm việc
     * @param registeredBy    UUID người đăng ký
     * @return ShiftScheduleJpaEntity với status = SCHEDULED
     */
    public static ShiftScheduleJpaEntity register(UUID tenantId, UUID branchId,
                                                   UUID userId, UUID shiftTemplateId,
                                                   LocalDate date, UUID registeredBy) {
        ShiftScheduleJpaEntity entity = new ShiftScheduleJpaEntity();

        entity.tenantId = tenantId;
        entity.branchId = branchId;
        entity.userId = userId;
        entity.shiftTemplateId = shiftTemplateId;
        entity.date = date;
        entity.status = "SCHEDULED";
        entity.overtimeMinutes = 0;
        entity.registeredBy = registeredBy;
        entity.createdAt = Instant.now();
        return entity;
    }

    /**
     * Nhân viên check-in.
     * Chỉ được thực hiện khi status = SCHEDULED.
     *
     * @param now       thời điểm check-in
     * @param startTime giờ bắt đầu thực tế
     */
    public void checkIn(Instant now, LocalTime startTime) {
        this.checkedInAt = now;
        this.actualStartTime = startTime.withNano(0);
        this.status = "CHECKED_IN";
    }

    /**
     * Nhân viên check-out.
     * Chỉ được thực hiện khi status = CHECKED_IN.
     *
     * @param now              thời điểm check-out
     * @param endTime          giờ kết thúc thực tế
     * @param templateEndTime  giờ kết thúc theo ca mẫu (để tính overtime)
     */
    public void checkOut(Instant now, LocalTime endTime, LocalTime templateEndTime) {
        this.checkedOutAt = now;
        this.actualEndTime = endTime.withNano(0);
        this.status = "COMPLETED";
        // Tính overtime: số phút chênh lệch so với ca mẫu
        long minutesDiff = java.time.Duration.between(templateEndTime, endTime).toMinutes();
        this.overtimeMinutes = (int) minutesDiff;
    }

    /** @return true nếu ca ở trạng thái chờ (chưa check-in) */
    public boolean isScheduled() { return "SCHEDULED".equals(status); }

    /** @return true nếu nhân viên đã check-in nhưng chưa check-out */
    public boolean isCheckedIn() { return "CHECKED_IN".equals(status); }
}
