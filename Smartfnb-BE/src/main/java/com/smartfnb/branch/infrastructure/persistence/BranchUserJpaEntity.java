package com.smartfnb.branch.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA Entity liên kết 1 User với 1 Branch.
 * Cho phép phân quyền nhân viên theo từng chi nhánh cụ thể.
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Entity
@Table(name = "branch_users")
@IdClass(BranchUserId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchUserJpaEntity {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(name = "is_primary_branch")
    @Builder.Default
    private boolean isPrimaryBranch = true;

    @Column(name = "assigned_at", updatable = false)
    private LocalDateTime assignedAt;

    @PrePersist
    public void prePersist() {
        if (this.assignedAt == null) {
            this.assignedAt = LocalDateTime.now();
        }
    }
}
