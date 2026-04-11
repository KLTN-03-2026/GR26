import type { Role } from '../constants/roles';
import { STAFF_ROUTE_PERMISSIONS } from '../constants/permissions';
import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import { hasAnyPermission } from './accessControl';

const STAFF_HOME_CANDIDATES = [
  {
    path: ROUTES.STAFF.TABLES,
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.TABLES,
  },
  {
    path: ROUTES.POS_ORDER,
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.POS_ORDER,
  },
  {
    path: ROUTES.POS_PAYMENT,
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.POS_PAYMENT,
  },
  {
    path: ROUTES.STAFF.INVENTORY,
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.INVENTORY,
  },
  {
    path: ROUTES.STAFF.MY_SHIFTS,
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.MY_SHIFTS,
  },
  {
    path: ROUTES.STAFF.DASHBOARD,
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.DASHBOARD,
  },
] as const;

/**
 * Chọn route đầu tiên staff thật sự có quyền mở.
 * Tránh trường hợp redirect vào chính route bị guard chặn và tạo màn hình trắng.
 */
const getFirstAccessibleStaffRoute = (
  permissions: readonly string[]
): string | null => {
  const matchedRoute = STAFF_HOME_CANDIDATES.find((candidate) =>
    hasAnyPermission(permissions, candidate.requiredPermissions)
  );

  return matchedRoute?.path ?? null;
};

/**
 * Get the homepage URL based on user role
 * Used for redirect after login or when user clicks "home"
 */
export function getRoleHomePage(
  role: Role,
  permissions: readonly string[] = []
): string {
  switch (role) {
    case ROLES.ADMIN:
      return ROUTES.ADMIN_DASHBOARD;
    case ROLES.OWNER:
      return ROUTES.OWNER.DASHBOARD;
    case ROLES.STAFF:
      return getFirstAccessibleStaffRoute(permissions) ?? ROUTES.STAFF.DASHBOARD;
    default:
      return ROUTES.LOGIN;
  }
}
