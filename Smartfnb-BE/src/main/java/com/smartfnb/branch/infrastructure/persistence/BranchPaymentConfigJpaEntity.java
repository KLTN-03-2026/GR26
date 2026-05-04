package com.smartfnb.branch.infrastructure.persistence;

// author: Hoàng
// date: 27-04-2026
// note: Entity lưu cấu hình cổng thanh toán PayOS theo từng chi nhánh.
//       apiKeyEncrypted và checksumKeyEncrypted là giá trị đã qua AES-256.

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "branch_payment_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchPaymentConfigJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** Client ID từ dashboard PayOS — không nhạy cảm, lưu plaintext */
    @Column(name = "client_id", nullable = false)
    private String clientId;

    /** API Key đã mã hoá AES-256 */
    @Column(name = "api_key_encrypted", nullable = false, columnDefinition = "TEXT")
    private String apiKeyEncrypted;

    /** Checksum Key đã mã hoá AES-256 */
    @Column(name = "checksum_key_encrypted", nullable = false, columnDefinition = "TEXT")
    private String checksumKeyEncrypted;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
