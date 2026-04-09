package com.smartfnb.inventory.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity cho bảng audit_logs.
 * Ghi lịch sử các thao tác nhạy cảm: điều chỉnh kho, thay đổi phân quyền, hoàn tiền...
 * Bắt buộc cho thao tác AdjustStock (S-14).
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
@Entity
@Table(
    name = "audit_logs",
    indexes = {
        @Index(name = "idx_audit_tenant_time", columnList = "tenant_id, created_at DESC"),
        @Index(name = "idx_audit_target",      columnList = "target_type, target_id")
    }
)
@Getter
@Setter(AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuditLogJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "user_id", updatable = false)
    private UUID userId;

    /**
     * Hành động thực hiện.
     * VD: STOCK_ADJUSTED, STOCK_WASTED, PERMISSION_CHANGED, ORDER_CANCELLED
     */
    @Column(name = "action", nullable = false, updatable = false, length = 100)
    private String action;

    /** Loại đối tượng bị tác động: inventory | user | order */
    @Column(name = "target_type", updatable = false, length = 50)
    private String targetType;

    /** ID đối tượng bị tác động */
    @Column(name = "target_id", updatable = false)
    private UUID targetId;

    /** Giá trị trước khi thay đổi (JSONB) */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "old_value", updatable = false, columnDefinition = "jsonb")
    private String oldValue;

    /** Giá trị sau khi thay đổi (JSONB) */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_value", updatable = false, columnDefinition = "jsonb")
    private String newValue;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Factory method tạo audit log cho điều chỉnh kho thủ công.
     *
     * @param tenantId UUID tenant
     * @param userId   UUID nhân viên thực hiện
     * @param itemId   UUID nguyên liệu bị điều chỉnh
     * @param oldValue giá trị trước (JSON string)
     * @param newValue giá trị sau (JSON string)
     * @return AuditLogJpaEntity mới
     */
    public static AuditLogJpaEntity forStockAdjustment(UUID tenantId, UUID userId,
                                                        UUID itemId,
                                                        String oldValue, String newValue) {
        AuditLogJpaEntity log = new AuditLogJpaEntity();
        log.tenantId = tenantId;
        log.userId = userId;
        log.action = "STOCK_ADJUSTED";
        log.targetType = "inventory";
        log.targetId = itemId;
        log.oldValue = oldValue;
        log.newValue = newValue;
        log.createdAt = Instant.now();
        return log;
    }

    /**
     * Factory method tạo audit log cho ghi nhận hao hụt.
     */
    public static AuditLogJpaEntity forWasteRecord(UUID tenantId, UUID userId,
                                                    UUID itemId, String detail) {
        AuditLogJpaEntity log = new AuditLogJpaEntity();
        log.tenantId = tenantId;
        log.userId = userId;
        log.action = "STOCK_WASTED";
        log.targetType = "inventory";
        log.targetId = itemId;
        log.newValue = detail;
        log.createdAt = Instant.now();
        return log;
    }

    /**
     * Factory method tạo audit log khi thay đổi phân quyền vai trò.
     * Bắt buộc ghi theo coding guidelines § 6.3 — thao tác nhạy cảm.
     *
     * @param tenantId       UUID tenant
     * @param userId         UUID người thực hiện thay đổi
     * @param roleId         UUID vai trò bị thay đổi
     * @param oldPermissions JSON string danh sách permission cũ
     * @param newPermissions JSON string danh sách permission mới
     * @return AuditLogJpaEntity
     */
    public static AuditLogJpaEntity forPermissionChange(UUID tenantId, UUID userId,
                                                         UUID roleId,
                                                         String oldPermissions,
                                                         String newPermissions) {
        AuditLogJpaEntity log = new AuditLogJpaEntity();
        log.tenantId = tenantId;
        log.userId = userId;
        log.action = "PERMISSION_CHANGED";
        log.targetType = "role";
        log.targetId = roleId;
        log.oldValue = oldPermissions;
        log.newValue = newPermissions;
        log.createdAt = Instant.now();
        return log;
    }

    /**
     * Factory method tạo audit log khi tạo / xóa staff.
     *
     * @param tenantId  UUID tenant
     * @param userId    UUID người thực hiện
     * @param staffId   UUID nhân viên bị tác động
     * @param action    Hành động: STAFF_CREATED | STAFF_DELETED | STAFF_DEACTIVATED
     * @param detail    Thông tin chi tiết (JSON string)
     * @return AuditLogJpaEntity
     */
    public static AuditLogJpaEntity forStaffAction(UUID tenantId, UUID userId,
                                                    UUID staffId, String action,
                                                    String detail) {
        AuditLogJpaEntity log = new AuditLogJpaEntity();
        log.tenantId = tenantId;
        log.userId = userId;
        log.action = action;
        log.targetType = "user";
        log.targetId = staffId;
        log.newValue = detail;
        log.createdAt = Instant.now();
        return log;
    }
}
