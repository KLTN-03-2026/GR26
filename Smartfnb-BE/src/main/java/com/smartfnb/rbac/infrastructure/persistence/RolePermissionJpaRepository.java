package com.smartfnb.rbac.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RolePermissionJpaRepository extends JpaRepository<RolePermissionJpaEntity, RolePermissionId> {
    List<RolePermissionJpaEntity> findByRoleIdIn(List<UUID> roleIds);
}
