package com.smartfnb.forecast.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * JPA Entity map bảng ai_series_registry — do AI Service tạo và quản lý.
 * BE chỉ đọc, KHÔNG ghi, KHÔNG có foreign key.
 * Mỗi row đại diện cho 1 chuỗi thời gian (ingredient × branch × tenant).
 *
 * @author Hoàng
 * @since 2026-04-23
 */
@Entity
@Table(name = "ai_series_registry", schema = "public")
@Getter
@NoArgsConstructor
public class AiSeriesRegistryJpaEntity {

    /** ID tự tăng của AI Service */
    @Id
    @Column(name = "id")
    private Long id;

    /** UUID của nguyên liệu (string, khớp với items.id) */
    @Column(name = "ingredient_id")
    private String ingredientId;

    /** UUID của chi nhánh (string, khớp với branches.id) */
    @Column(name = "branch_id")
    private String branchId;

    /** UUID của tenant (string, khớp với tenants.id) */
    @Column(name = "tenant_id")
    private String tenantId;

    /** Thời điểm đăng ký series */
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
