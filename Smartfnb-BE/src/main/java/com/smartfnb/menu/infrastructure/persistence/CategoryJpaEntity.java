package com.smartfnb.menu.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity cho bảng categories.
 * Đại diện cho danh mục món ăn/đồ uống trong thực đơn.
 * Unique: (tenant_id, name).
 *
 * @author SmartF&B Team
 * @since 2026-03-28
 */
@Entity
@Table(name = "categories")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class CategoryJpaEntity {

    /** ID duy nhất của danh mục */
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    /** ID tenant sở hữu danh mục này */
    @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    /** Tên danh mục — unique trong tenant */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /** Mô tả ngắn về danh mục */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Thứ tự hiển thị trên menu */
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    /** Trạng thái hiển thị — false khi vô hiệu hóa */
    @Column(name = "is_active")
    private Boolean isActive = true;

    /** Thời điểm tạo danh mục */
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
