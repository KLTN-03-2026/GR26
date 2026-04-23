package com.smartfnb.order.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity cho bảng tables.
 * Đại diện cho bàn trong chi nhánh với hỗ trợ Drag & Drop (position_x/y)
 * và soft delete (deleted_at).
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Entity
@Table(name = "tables")
@Getter
@Setter
@NoArgsConstructor
public class TableJpaEntity {

    /** ID duy nhất của bàn */
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    /**
     * ID tenant sở hữu bàn này.
     * Bắt buộc trong mọi query để đảm bảo multi-tenant isolation.
     */
    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    /** ID chi nhánh chứa bàn này */
    @Column(name = "branch_id", nullable = false, columnDefinition = "uuid")
    private UUID branchId;

    /** ID khu vực — null nếu chưa xếp vào zone */
    @Column(name = "zone_id", columnDefinition = "uuid")
    private UUID zoneId;

    /** Tên bàn — unique trong (branch_id, zone_id) */
    @Column(name = "name", nullable = false, length = 50)
    private String name;

    /** Số chỗ ngồi — phải > 0 */
    @Column(name = "capacity")
    private Integer capacity = 4;

    /**
     * Trạng thái bàn hiện tại.
     * AVAILABLE | OCCUPIED | CLEANING
     */
    @Column(name = "status", nullable = false, length = 20)
    private String status = "AVAILABLE";

    /**
     * Tọa độ X trên sơ đồ bàn (pixel/percent).
     * Được cập nhật qua batch update khi nhân viên Drag & Drop.
     */
    @Column(name = "position_x", precision = 8, scale = 2)
    private BigDecimal positionX = BigDecimal.ZERO;

    /**
     * Tọa độ Y trên sơ đồ bàn (pixel/percent).
     * Được cập nhật qua batch update khi nhân viên Drag & Drop.
     */
    @Column(name = "position_y", precision = 8, scale = 2)
    private BigDecimal positionY = BigDecimal.ZERO;

    /**
     * Hình dạng bàn trên sơ đồ.
     * square | round
     */
    @Column(name = "shape", length = 10)
    private String shape = "square";

    /** Trạng thái kích hoạt */
    @Column(name = "is_active")
    private Boolean isActive = true;

    /**
     * Thời điểm soft delete — NULL nghĩa là chưa xóa.
     * Không hard delete để bảo toàn lịch sử đơn hàng liên kết.
     */
    @Column(name = "deleted_at")
    private Instant deletedAt;

    /**
     * Kiểm tra bàn đã bị soft delete chưa.
     *
     * @return true nếu đã xóa mềm
     */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * Thực hiện soft delete.
     * Đặt deleted_at và is_active = false.
     */
    public void softDelete() {
        this.deletedAt = Instant.now();
        this.isActive = false;
    }

    /**
     * Kiểm tra bàn có đang trống không.
     * Dùng trước khi tạo đơn hàng.
     *
     * @return true nếu bàn AVAILABLE
     */
    public boolean isAvailable() {
        return "AVAILABLE".equals(this.status);
    }
}
