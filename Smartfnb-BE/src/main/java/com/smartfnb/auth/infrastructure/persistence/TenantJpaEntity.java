package com.smartfnb.auth.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA Entity cho bảng tenants.
 * Đại diện cho một chuỗi F&B (chủ quán đăng ký = 1 tenant).
 * Không kế thừa BaseAggregateRoot vì tenants là root không có tenantId ngoài.
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Entity
@Table(name = "tenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantJpaEntity {

    /** Khóa chính UUID */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * ID gói dịch vụ đang sử dụng.
     * FK tới bảng plans — ON DELETE RESTRICT.
     */
    @Column(name = "plan_id")
    private UUID planId;

    /** Tên thương hiệu chuỗi F&B (VD: "Cà phê Phúc Long") */
    @Column(name = "name", nullable = false)
    private String name;

    /** Slug URL-friendly unique (VD: "phuc-long") */
    @Column(name = "slug", unique = true)
    private String slug;

    /** Email doanh nghiệp — unique toàn hệ thống */
    @Column(name = "email", unique = true, nullable = false)
    private String email;

    /** Số điện thoại liên hệ */
    @Column(name = "phone")
    private String phone;

    /** Mã số thuế */
    @Column(name = "tax_code")
    private String taxCode;

    /** URL logo thương hiệu */
    @Column(name = "logo_url")
    private String logoUrl;

    /**
     * Trạng thái tenant.
     * ACTIVE — đang hoạt động bình thường
     * SUSPENDED — tạm khóa (hết hạn trả phí)
     * CANCELLED — đã hủy
     */
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    /** Thời điểm hết hạn gói dịch vụ */
    @Column(name = "plan_expires_at")
    private LocalDateTime planExpiresAt;

    /** Thời điểm tạo — tự động set */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
