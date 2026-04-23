package com.smartfnb.plan.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA Entity cho bảng subscriptions.
 * Liên kết Tenant ↔ Plan, lưu thời hạn hiệu lực gói dịch vụ.
 *
 * <p>Một tenant tại một thời điểm chỉ có 1 subscription ACTIVE.
 * Lịch sử thanh toán/nâng cấp được ghi nhận qua status cũ → EXPIRED.</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Tenant sử dụng gói dịch vụ này */
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** Gói dịch vụ đang sử dụng */
    @Column(name = "plan_id", nullable = false)
    private UUID planId;

    /**
     * Trạng thái subscription.
     * ACTIVE   — đang có hiệu lực
     * EXPIRED  — đã hết hạn
     * CANCELLED — đã hủy
     */
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    /** Ngày bắt đầu hiệu lực */
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    /** Ngày hết hạn — null nếu là trial không giới hạn */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /** Thời điểm tạo bản ghi */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
