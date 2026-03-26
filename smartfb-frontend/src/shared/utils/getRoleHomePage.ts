import type { Role } from '../constants/roles';
import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';

/**
 * Get the homepage URL based on user role
 * Used for redirect after login or when user clicks "home"
 */
export function getRoleHomePage(role: Role): string {
  switch (role) {
    case ROLES.ADMIN:
      return ROUTES.ADMIN_DASHBOARD;
    case ROLES.OWNER:
      return ROUTES.OWNER.DASHBOARD;
    case ROLES.STAFF:
      return ROUTES.STAFF.DASHBOARD;
    default:
      return ROUTES.LOGIN;
  }
}
