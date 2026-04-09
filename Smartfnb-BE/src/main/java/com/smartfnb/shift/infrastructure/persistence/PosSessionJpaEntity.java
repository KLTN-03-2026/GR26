package com.smartfnb.shift.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity cho bảng pos_sessions (phiên mở quầy POS).
 * Quản lý tiền mặt đầu/cuối ca — mỗi branch chỉ có 1 session OPEN.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Entity
@Table(
    name = "pos_sessions",
    indexes = {
        @Index(name = "idx_pos_sessions_branch_status", columnList = "branch_id, status"),
        @Index(name = "idx_pos_sessions_tenant",        columnList = "tenant_id, start_time DESC")
    }
)
@Getter
@Setter(AccessLevel.PACKAGE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PosSessionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "branch_id", nullable = false, updatable = false)
    private UUID branchId;

    /** Cashier mở quầy */
    @Column(name = "opened_by_user_id", nullable = false, updatable = false)
    private UUID openedByUserId;

    /** Cashier đóng quầy (null khi session đang OPEN) */
    @Column(name = "closed_by_user_id")
    private UUID closedByUserId;

    /** Liên kết với ca làm việc (nullable) */
    @Column(name = "shift_schedule_id")
    private UUID shiftScheduleId;

    @Column(name = "start_time", nullable = false, updatable = false)
    private Instant startTime;

    /** Thời điểm đóng quầy */
    @Column(name = "end_time")
    private Instant endTime;

    /** Tiền mặt đầu ca */
    @Column(name = "starting_cash", nullable = false, precision = 12, scale = 2)
    private BigDecimal startingCash;

    /** Tiền mặt kỳ vọng cuối ca (tính từ starting_cash + tổng cash orders) */
    @Column(name = "ending_cash_expected", precision = 12, scale = 2)
    private BigDecimal endingCashExpected;

    /** Tiền mặt thực tế kiểm đếm khi đóng ca */
    @Column(name = "ending_cash_actual", precision = 12, scale = 2)
    private BigDecimal endingCashActual;

    /** Chênh lệch tiền mặt (actual - expected), có thể âm */
    @Column(name = "cash_difference", precision = 12, scale = 2)
    private BigDecimal cashDifference;

    /** Ghi chú khi đóng ca */
    @Column(name = "note", length = 500)
    private String note;

    /** Trạng thái: OPEN | CLOSED */
    @Column(name = "status", nullable = false, length = 10)
    private String status;

    /**
     * Factory method mở phiên POS mới.
     *
     * @param tenantId        UUID tenant
     * @param branchId        UUID chi nhánh
     * @param openedByUserId  UUID cashier mở quầy
     * @param startingCash    Tiền mặt đầu ca
     * @param shiftScheduleId UUID ca làm việc (nullable)
     * @return PosSessionJpaEntity với status = OPEN
     */
    public static PosSessionJpaEntity open(UUID tenantId, UUID branchId,
                                            UUID openedByUserId,
                                            BigDecimal startingCash,
                                            UUID shiftScheduleId) {
        PosSessionJpaEntity entity = new PosSessionJpaEntity();

        entity.tenantId = tenantId;
        entity.branchId = branchId;
        entity.openedByUserId = openedByUserId;
        entity.shiftScheduleId = shiftScheduleId;
        entity.startTime = Instant.now();
        entity.startingCash = startingCash != null ? startingCash : BigDecimal.ZERO;
        entity.status = "OPEN";
        return entity;
    }

    /**
     * Đóng phiên POS và ghi nhận tiền cuối ca.
     *
     * @param closedByUserId    UUID cashier đóng quầy
     * @param endingCashActual  Tiền mặt thực tế kiểm đếm
     * @param endingCashExpected Tiền mặt kỳ vọng (starting + cash orders)
     * @param note              Ghi chú khi đóng ca
     */
    public void close(UUID closedByUserId, BigDecimal endingCashActual,
                       BigDecimal endingCashExpected, String note) {
        this.closedByUserId = closedByUserId;
        this.endingCashActual = endingCashActual;
        this.endingCashExpected = endingCashExpected;
        this.cashDifference = endingCashActual.subtract(endingCashExpected);
        this.endTime = Instant.now();
        this.note = note;
        this.status = "CLOSED";
    }

    /** @return true nếu phiên đang mở */
    public boolean isOpen() { return "OPEN".equals(status); }
}
