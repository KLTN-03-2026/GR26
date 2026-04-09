package com.smartfnb.rbac.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

/**
 * JPA Entity cho bảng permissions.
 * 31 quyền hệ thống được seed từ Flyway V1 — BẤT BIẾN, không thêm/xóa qua API.
 *
 * <p><b>Thiết kế PK quan trọng:</b> id là String (mã quyền) như "ORDER_CREATE", "PAYMENT_VIEW".
 * Không dùng UUID vì schema dùng VARCHAR(60) làm natural key — tiện query và readable.</p>
 *
 * <p>Cấu trúc DB: permissions(id VARCHAR(60) PK, module VARCHAR, description VARCHAR)</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-27 (sửa: String id thay UUID để match DB schema)
 */
@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionJpaEntity {

    /**
     * Mã quyền dạng SNAKE_UPPER_CASE — là Primary Key tự nhiên (Natural Key).
     * VD: ORDER_CREATE, PAYMENT_VIEW, BRANCH_EDIT
     * Seed từ Flyway V1 — không tạo qua API.
     */
    @Id
    @Column(name = "id", length = 60, updatable = false, nullable = false)
    private String id;   // String, KHÔNG phải UUID — match VARCHAR(60) trong DB

    /**
     * Nhóm module của quyền — dùng để nhóm trên UI quản lý.
     * VD: POS, PAYMENT, MENU, INVENTORY, HR, REPORT, SYSTEM
     */
    @Column(name = "module", nullable = false, length = 50)
    private String module;

    /** Mô tả ngắn gọn — hiển thị trên UI quản lý phân quyền */
    @Column(name = "description", length = 255)
    private String description;
}
