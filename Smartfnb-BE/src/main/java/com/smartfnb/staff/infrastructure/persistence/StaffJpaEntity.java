package com.smartfnb.staff.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * JPA Entity mapping bảng users với các trường nhân sự (Staff).
 * Dùng chung bảng users để đồng nhất với hệ thống xác thực.
 * Soft delete qua trường deleted_at.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_users_tenant_active", columnList = "tenant_id")
    }
)
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StaffJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** UUID tenant — không thay đổi sau khi tạo */
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    /** Họ tên đầy đủ */
    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    /** Email đăng nhập (nullable cho nhân viên không có email) */
    @Column(name = "email", length = 255)
    private String email;

    /** Số điện thoại — unique trong tenant */
    @Column(name = "phone", length = 20)
    private String phone;

    /** Mật khẩu đã hash (bcrypt) */
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    /** PIN đăng nhập POS nhanh (đã hash) */
    @Column(name = "pos_pin", length = 255)
    private String posPin;

    /** Trạng thái tài khoản: ACTIVE | INACTIVE | LOCKED */
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    /** UUID chức vụ của nhân viên */
    @Column(name = "position_id")
    private UUID positionId;

    /** Mã nhân viên (VD: NV001) — unique trong tenant */
    @Column(name = "employee_code", length = 50)
    private String employeeCode;

    /** Ngày sinh */
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    /** Giới tính: MALE | FEMALE | OTHER */
    @Column(name = "gender", length = 10)
    private String gender;

    /** Địa chỉ */
    @Column(name = "address")
    private String address;

    /** URL ảnh đại diện */
    @Column(name = "avatar_url")
    private String avatarUrl;

    /** Ngày vào làm */
    @Column(name = "hire_date")
    private LocalDate hireDate;

    /** Thời điểm tạo */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Soft delete timestamp */
    @Column(name = "deleted_at")
    private Instant deletedAt;

    /**
     * Factory method tạo nhân viên mới.
     *
     * @param tenantId   UUID tenant
     * @param fullName   Họ tên đầy đủ
     * @param phone      Số điện thoại
     * @param email      Email (nullable)
     * @param positionId UUID chức vụ (nullable)
     * @param employeeCode Mã nhân viên (nullable)
     * @param hireDate   Ngày vào làm (nullable)
     * @return StaffJpaEntity mới với status = ACTIVE
     */
    public static StaffJpaEntity create(UUID tenantId, String fullName, String phone,
                                        String email, UUID positionId, String employeeCode,
                                        LocalDate hireDate) {
        StaffJpaEntity entity = new StaffJpaEntity();

        entity.tenantId = tenantId;
        entity.fullName = fullName;
        entity.phone = phone;
        entity.email = email;
        entity.positionId = positionId;
        entity.employeeCode = employeeCode;
        entity.hireDate = hireDate;
        entity.status = "ACTIVE";
        entity.createdAt = Instant.now();
        return entity;
    }

    /**
     * Thực hiện soft delete nhân viên.
     */
    public void softDelete() {
        this.deletedAt = Instant.now();
        this.status = "INACTIVE";
    }

    /**
     * Khoá tài khoản nhân viên.
     */
    public void deactivate() {
        this.status = "INACTIVE";
    }

    /**
     * Kích hoạt lại tài khoản.
     */
    public void activate() {
        this.status = "ACTIVE";
    }

    /** @return true nếu nhân viên đang hoạt động */
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }
}
