import { ROLES } from '@shared/constants/roles';
import type { StaffRole } from '../types/role.types';

/**
 * Loại bỏ các role hệ thống không nên gán trực tiếp cho nhân viên vận hành.
 * Hiện tại ẩn `owner` khỏi mọi UI gán vai trò cho staff.
 */
export const filterAssignableStaffRoles = (roles: StaffRole[]): StaffRole[] => {
  return roles.filter((role) => role.name.trim().toLowerCase() !== ROLES.OWNER);
};
