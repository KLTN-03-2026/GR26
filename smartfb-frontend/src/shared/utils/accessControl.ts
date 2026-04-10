import { ROLES, type Role } from '@shared/constants/roles';

export interface AccessRequirement {
  roles?: Role[];
  requiredPermissions?: string[];
}

interface PermissionContext {
  role: Role;
  permissions?: string[];
}

/**
 * Kiểm tra user hiện tại có ít nhất một quyền trong danh sách yêu cầu hay không.
 */
export const hasAnyPermission = (
  currentPermissions: readonly string[],
  requiredPermissions?: readonly string[]
): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  return requiredPermissions.some((permission) => currentPermissions.includes(permission));
};

/**
 * Kiểm tra user hiện tại có đầy đủ toàn bộ quyền trong danh sách yêu cầu hay không.
 */
export const hasAllPermissions = (
  currentPermissions: readonly string[],
  requiredPermissions?: readonly string[]
): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  return requiredPermissions.every((permission) => currentPermissions.includes(permission));
};

/**
 * Kiểm tra rule truy cập tổng quát cho route hoặc menu item.
 * Nếu có cấu hình `roles` thì vẫn phải đúng vai trò hệ thống trước,
 * sau đó mới xét tiếp lớp permission chi tiết.
 */
export const hasAccess = (
  { role, permissions = [] }: PermissionContext,
  requirement?: AccessRequirement
): boolean => {
  if (!requirement) {
    return true;
  }

  if (requirement.roles && requirement.roles.length > 0 && !requirement.roles.includes(role)) {
    return false;
  }

  if (role === ROLES.ADMIN || role === ROLES.OWNER) {
    return true;
  }

  return hasAnyPermission(permissions, requirement.requiredPermissions);
};
