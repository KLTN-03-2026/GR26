import { ROLES, type Role } from '@shared/constants/roles';
import type { StaffSummary } from '../types/staff.types';

interface FilterVisibleStaffByViewerRoleParams {
  staffList: StaffSummary[];
  viewerRole: Role;
  viewerUserId?: string | null;
}

const hasOwnerRole = (roles: string[]): boolean => {
  return roles.some((role) => role.trim().toLowerCase() === ROLES.OWNER);
};

/**
 * Lọc danh sách nhân sự theo ngữ cảnh người xem hiện tại.
 * Với tài khoản owner, UI không hiển thị lại chính owner trong màn hình quản lý nhân sự.
 */
export const filterVisibleStaffByViewerRole = ({
  staffList,
  viewerRole,
  viewerUserId,
}: FilterVisibleStaffByViewerRoleParams): StaffSummary[] => {
  if (viewerRole !== ROLES.OWNER) {
    return staffList;
  }

  return staffList.filter((staff) => {
    if (viewerUserId && staff.id === viewerUserId) {
      return false;
    }

    return !hasOwnerRole(staff.roles);
  });
};
