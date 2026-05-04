package com.smartfnb.supplier.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity cho bảng suppliers.
 * Scoped theo tenant — không liên kết với branch (nhà cung cấp dùng chung toàn chuỗi).
 *
 * @author vutq
 * @since 2026-04-07
 */
@Entity
@Table(
    name = "suppliers",
    indexes = {
        @Index(name = "idx_suppliers_tenant", columnList = "tenant_id"),
        @Index(name = "idx_suppliers_name",   columnList = "tenant_id, name")
    }
)
@Getter
@Setter(AccessLevel.PACKAGE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SupplierJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "contact_name", length = 100)
    private String contactName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "tax_code", length = 20)
    private String taxCode;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Factory method tạo nhà cung cấp mới.
     */
    public static SupplierJpaEntity create(UUID tenantId, String name, String code,
                                            String contactName, String phone, String email,
                                            String address, String taxCode, String note) {
        SupplierJpaEntity e = new SupplierJpaEntity();
        e.tenantId    = tenantId;
        e.name        = name;
        e.code        = code;
        e.contactName = contactName;
        e.phone       = phone;
        e.email       = email;
        e.address     = address;
        e.taxCode     = taxCode;
        e.note        = note;
        e.active      = true;
        e.createdAt   = Instant.now();
        e.updatedAt   = Instant.now();
        return e;
    }

    /** Cập nhật thông tin nhà cung cấp. */
    public void update(String name, String code, String contactName, String phone,
                       String email, String address, String taxCode, String note, boolean active) {
        this.name        = name;
        this.code        = code;
        this.contactName = contactName;
        this.phone       = phone;
        this.email       = email;
        this.address     = address;
        this.taxCode     = taxCode;
        this.note        = note;
        this.active      = active;
        this.updatedAt   = Instant.now();
    }

    /** Soft-delete */
    public void deactivate() {
        this.active    = false;
        this.updatedAt = Instant.now();
    }
}
