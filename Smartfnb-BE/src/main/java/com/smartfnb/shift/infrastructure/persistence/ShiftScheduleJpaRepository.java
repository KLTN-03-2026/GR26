package com.smartfnb.shift.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository cho bảng shift_schedules (ca làm việc thực tế).
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public interface ShiftScheduleJpaRepository
        extends JpaRepository<ShiftScheduleJpaEntity, UUID> {

    /**
     * Kiểm tra nhân viên đã đăng ký ca này trong ngày chưa
     * (validate unique constraint: user_id + template_id + date).
     *
     * @param userId          UUID nhân viên
     * @param shiftTemplateId UUID ca mẫu
     * @param date            Ngày làm việc
     * @return true nếu đã tồn tại lịch
     */
    boolean existsByUserIdAndShiftTemplateIdAndDate(UUID userId, UUID shiftTemplateId, LocalDate date);

    /**
     * Lấy toàn bộ lịch ca của branch trong một khoảng ngày.
     *
     * @param branchId  UUID chi nhánh
     * @param tenantId  UUID tenant
     * @param startDate ngày bắt đầu (inclusive)
     * @param endDate   ngày kết thúc (inclusive)
     * @return Danh sách ca làm việc
     */
    @Query("SELECT s FROM ShiftScheduleJpaEntity s WHERE s.branchId = :branchId " +
           "AND s.tenantId = :tenantId AND s.date BETWEEN :startDate AND :endDate " +
           "ORDER BY s.date, s.userId")
    List<ShiftScheduleJpaEntity> findByBranchAndDateRange(
            @Param("branchId") UUID branchId,
            @Param("tenantId") UUID tenantId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Lấy lịch ca của một nhân viên trong khoảng ngày.
     *
     * @param userId    UUID nhân viên
     * @param tenantId  UUID tenant
     * @param startDate ngày bắt đầu
     * @param endDate   ngày kết thúc
     * @return Danh sách ca của nhân viên
     */
    @Query("SELECT s FROM ShiftScheduleJpaEntity s WHERE s.userId = :userId " +
           "AND s.tenantId = :tenantId AND s.date BETWEEN :startDate AND :endDate " +
           "ORDER BY s.date")
    List<ShiftScheduleJpaEntity> findByUserAndDateRange(
            @Param("userId") UUID userId,
            @Param("tenantId") UUID tenantId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Tìm shift schedule theo ID và tenant (kiểm tra ownership).
     *
     * @param id       UUID shift schedule
     * @param tenantId UUID tenant
     * @return Optional ShiftScheduleJpaEntity
     */
    Optional<ShiftScheduleJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * Lấy danh sách ca đang CHECKED_IN tại branch (để kiểm tra trước khi đóng POS).
     *
     * @param branchId UUID chi nhánh
     * @param status   trạng thái ca (CHECKED_IN)
     * @return Danh sách ca
     */
    List<ShiftScheduleJpaEntity> findByBranchIdAndStatus(UUID branchId, String status);
}
