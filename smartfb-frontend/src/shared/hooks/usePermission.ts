import { useAuthStore } from '@modules/auth/stores/authStore';
import type { Role } from '../constants/roles';
import { ROLES } from '../constants/roles';

/**
 * Hook lấy role và permission hiện tại từ auth store.
 */
export const usePermission = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role ?? ROLES.STAFF);
  const permissions = useAuthStore((state) => state.session?.permissions ?? []);

  const isAdmin = userRole === ROLES.ADMIN;
  const isOwner = userRole === ROLES.OWNER;
  const isStaff = userRole === ROLES.STAFF;

  /**
   * Kiểm tra user hiện tại có quyền thao tác hay không.
   *
   * @param permission - Mã quyền theo backend như `STAFF_EDIT`, `MENU_VIEW`
   */
  const can = (permission: string): boolean => {
    if (!isAuthenticated) {
      return false;
    }

    if (isAdmin || isOwner) {
      return true;
    }

    return permissions.includes(permission);
  };

  return {
    userRole: userRole as Role,
    permissions,
    isAuthenticated,
    isAdmin,
    isOwner,
    isStaff,
    can,
  };
};
