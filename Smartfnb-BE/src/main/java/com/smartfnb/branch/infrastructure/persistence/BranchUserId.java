package com.smartfnb.branch.infrastructure.persistence;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

/**
 * Composite Primary Key cho BranchUserJpaEntity.
 * Map tới cột (user_id, branch_id) trong bảng branch_users.
 *
 * @author SmartF&B Team
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class BranchUserId implements Serializable {
    private UUID userId;
    private UUID branchId;
}
