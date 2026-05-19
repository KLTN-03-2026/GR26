# Bug Reports

## 2026-04-02 - Duplicate `OWNER` role when registering tenant

### Symptom

- Request `POST /api/v1/auth/register` fails near transaction commit.
- Stack trace ends with:
  `ERROR: duplicate key value violates unique constraint "uq_role_name_tenant"`
- Database detail:
  `Key (tenant_id, name)=(..., OWNER) already exists.`

### Root Cause

There are currently two code paths creating the same `OWNER` role for the same tenant during one registration flow:

1. `RegisterTenantCommandHandler` creates `OWNER`, assigns it to the new user, and attaches all permissions.
2. The same handler then publishes `TenantRegisteredEvent`.
3. `RbacTenantRegisteredEventHandler` listens to that event synchronously and creates `OWNER` again, then assigns permissions and user-role again.

Because the `roles` table has a unique constraint on `(tenant_id, name)`, the second insert for `OWNER` in the same tenant fails.

### Evidence In Code

- `Smartfnb-BE/src/main/java/com/smartfnb/auth/application/command/RegisterTenantCommandHandler.java`
  - lines `112-140`: creates `OWNER`, `user_roles`, and `role_permissions`
  - lines `151-154`: publishes `TenantRegisteredEvent`
- `Smartfnb-BE/src/main/java/com/smartfnb/rbac/application/eventhandler/RbacTenantRegisteredEventHandler.java`
  - lines `40-74`: creates `OWNER`, `role_permissions`, and `user_roles` again
- `Smartfnb-BE/src/main/resources/db/migration/V1__init_schema.sql`
  - lines `135-140`: defines constraint `uq_role_name_tenant UNIQUE (tenant_id, name)`

### Why The Exception Appears At Commit Time

Hibernate queues write actions and flushes them before transaction completion. That is why the error appears in:

- `ActionQueue.executeActions(...)`
- `AbstractFlushingEventListener.performExecutions(...)`
- `JpaTransactionManager.doCommit(...)`

instead of surfacing exactly at the `save(...)` line where the second `OWNER` role is scheduled.

### Impact

- Tenant registration is rolled back.
- New tenant and owner account are not created successfully.
- Frontend will receive a server-side failure for register flow.

### Recommended Fix

Use a single owner for RBAC bootstrap during tenant registration.

Recommended approach for this codebase:

- Keep RBAC bootstrap in `RegisterTenantCommandHandler`, because JWT generation in that handler already depends on the role and permissions being available immediately.
- Remove the duplicate RBAC creation logic from `RbacTenantRegisteredEventHandler`.
- Keep `TenantRegisteredEvent` for subscription/audit side effects only, which also matches the current comment in `TenantRegisteredEvent`.

### Important Note

Do not treat this as only a missing existence check.

If you only add a guard such as `findByTenantIdAndName(...)` in one place but still keep both code paths responsible for tenant RBAC bootstrap, ownership remains split and future inconsistencies are still likely.
