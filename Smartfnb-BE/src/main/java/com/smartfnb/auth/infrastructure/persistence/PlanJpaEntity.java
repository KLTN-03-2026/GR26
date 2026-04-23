package com.smartfnb.auth.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA Entity cho bảng plans.
 * Đại diện cho gói dịch vụ SaaS: Basic / Standard / Premium.
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Entity
@Table(name = "plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Tên gói — unique */
    @Column(name = "name", nullable = false, unique = true)
    private String name;

    /** Slug URL-friendly — unique */
    @Column(name = "slug", nullable = false, unique = true)
    private String slug;

    /** Giá gói theo tháng (VNĐ) */
    @Column(name = "price_monthly", nullable = false)
    private BigDecimal priceMonthly;

    /** Số chi nhánh tối đa được tạo */
    @Column(name = "max_branches", nullable = false)
    @Builder.Default
    private int maxBranches = 1;

    /**
     * Feature flags dạng JSON.
     * VD: {"POS": true, "INVENTORY": true, "PROMOTION": false, "AI": false}
     */
    @Column(name = "features", columnDefinition = "jsonb")
    @Builder.Default
    private String features = "{}";

    /** Gói có đang kích hoạt không */
    @Column(name = "is_active")
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
