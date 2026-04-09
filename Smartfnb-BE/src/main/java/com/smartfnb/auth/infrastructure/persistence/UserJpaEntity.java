package com.smartfnb.auth.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA Entity cho bảng users.
 * Đại diện cho tài khoản người dùng: Owner, Admin, Cashier, Barista, Waiter...
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserJpaEntity {

    /** Khóa chính UUID */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * ID tenant sở hữu user này.
     * Mọi query PHẢI filter theo tenantId để đảm bảo data isolation.
     */
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    /** Tên đầy đủ của nhân viên */
    @Column(name = "full_name", nullable = false)
    private String fullName;

    /** Email đăng nhập — unique trong cùng tenant */
    @Column(name = "email")
    private String email;

    /** Số điện thoại — unique trong cùng tenant */
    @Column(name = "phone")
    private String phone;

    /** Mật khẩu đã hash bằng BCrypt */
    @Column(name = "password_hash")
    private String passwordHash;

    /** PIN (hashed) dùng để đăng nhập POS nhanh */
    @Column(name = "pos_pin")
    private String posPin;

    /**
     * Trạng thái tài khoản.
     * ACTIVE — đang hoạt động
     * INACTIVE — đã vô hiệu hóa
     * LOCKED — bị khóa tạm thời do sai mật khẩu quá nhiều lần
     */
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    /** Số lần đăng nhập sai liên tiếp — reset về 0 sau khi đăng nhập thành công */
    @Column(name = "failed_login_count")
    @Builder.Default
    private int failedLoginCount = 0;

    /** Thời điểm tài khoản bị khóa tạm thời — null nếu chưa bị khóa */
    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    /** Thời điểm đăng nhập lần cuối thành công */
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    /** Thời điểm tạo tài khoản */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
