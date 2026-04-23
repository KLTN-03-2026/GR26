package com.smartfnb.shared.domain;

import jakarta.persistence.*;
import lombok.Getter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lớp gốc cho tất cả Aggregate Root trong hệ thống SmartF&B.
 * Cung cấp các trường audit chung: id, tenantId, createdAt, updatedAt, createdBy.
 *
 * <p>Mọi JPA Entity đại diện cho Aggregate Root PHẢI kế thừa class này.
 * Entity không phải Aggregate Root (VD: Value Object được embed) không cần kế thừa.</p>
 *
 * <p>Quy tắc multi-tenant: mọi query PHẢI filter theo tenantId.</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseAggregateRoot {

    /**
     * Khóa chính UUID — tự động sinh bởi PostgreSQL uuid_generate_v4().
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * ID của tenant sở hữu entity này — mọi query PHẢI filter theo trường này.
     * Không được thay đổi sau khi tạo.
     */
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    /**
     * Thời điểm tạo bản ghi — tự động set bởi JPA Auditing.
     */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Thời điểm cập nhật cuối — tự động set bởi JPA Auditing.
     */
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * ID người dùng tạo bản ghi — lấy từ SecurityContext qua AuditorAware.
     */
    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private UUID createdBy;

    /**
     * Khởi tạo với tenantId — bắt buộc khi tạo mới entity.
     *
     * @param tenantId UUID của tenant sở hữu entity
     */
    protected BaseAggregateRoot(UUID tenantId) {
        this.tenantId = tenantId;
    }

    /**
     * Constructor mặc định cho JPA — không dùng trực tiếp.
     */
    protected BaseAggregateRoot() {}
}
